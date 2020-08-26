import { ECS, CloudWatchLogs } from 'aws-sdk';
import { SCAN_SCHEMA } from '../api/scans';
import * as Docker from 'dockerode';

export interface CommandOptions {
  organizationId?: string;
  organizationName?: string;
  scanId: string;
  scanName: string;
  scanTaskId: string;
  chunkNumber?: number;
  numChunks?: number;
}

const toSnakeCase = (input) => input.replace(/ /g, '-');

/**
 * ECS Client. Normally, submits jobs to ECS.
 * When the app is running locally, runs a
 * Docker container locally instead.
 */
class ECSClient {
  ecs?: ECS;
  cloudWatchLogs?: CloudWatchLogs;
  docker?: Docker;
  isLocal: boolean;

  constructor(isLocal?: boolean) {
    this.isLocal =
      isLocal ??
      (process.env.IS_OFFLINE || process.env.IS_LOCAL ? true : false);
    if (this.isLocal) {
      this.docker = new Docker();
    } else {
      this.ecs = new ECS();
      this.cloudWatchLogs = new CloudWatchLogs();
    }
  }

  /**
   * Launches an ECS task with the given command.
   * @param commandOptions Command options
   */
  async runCommand(commandOptions: CommandOptions) {
    const {
      scanId,
      scanName,
      organizationId,
      organizationName,
      numChunks,
      chunkNumber
    } = commandOptions;
    const { cpu, memory, global } = SCAN_SCHEMA[scanName];
    if (this.isLocal) {
      try {
        const containerName = toSnakeCase(
          `crossfeed_worker_${
            global ? 'global' : organizationName
          }_${scanName}_` + Math.floor(Math.random() * 10000000)
        );
        const container = await this.docker!.createContainer({
          // We need to create unique container names to avoid conflicts.
          name: containerName,
          Image: 'crossfeed-worker',
          Env: [
            `CROSSFEED_COMMAND_OPTIONS=${JSON.stringify(commandOptions)}`,
            `DB_DIALECT=${process.env.DB_DIALECT}`,
            `DB_HOST=localhost`,
            `IS_LOCAL=true`,
            `DB_PORT=${process.env.DB_PORT}`,
            `DB_NAME=${process.env.DB_NAME}`,
            `DB_USERNAME=${process.env.DB_USERNAME}`,
            `DB_PASSWORD=${process.env.DB_PASSWORD}`,
            `CENSYS_API_ID=${process.env.CENSYS_API_ID}`,
            `CENSYS_API_SECRET=${process.env.CENSYS_API_SECRET}`
          ],
          // Since the ECSClient is itself running in the backend Docker container,
          // we launch a Docker container from the host Docker daemon. This means that
          // we cannot the host name "db" to access the database from the
          // crossfeed-worker image; instead, we set NetworkMode to "host" and
          // connect to "localhost."
          NetworkMode: 'host'
        } as any);
        await container.start();
        return {
          tasks: [
            {
              taskArn: containerName
            }
          ],
          failures: []
        };
      } catch (e) {
        console.error(e);
        return {
          tasks: [],
          failures: [{}]
        };
      }
    }
    const tags = [
      {
        key: 'scanId',
        value: scanId
      },
      {
        key: 'scanName',
        value: scanName
      }
    ];
    if (organizationName && organizationId) {
      tags.push({
        key: 'organizationId',
        value: organizationId
      });
      tags.push({
        key: 'organizationName',
        value: organizationName
      });
    }
    if (numChunks !== undefined && chunkNumber !== undefined) {
      tags.push({
        key: 'numChunks',
        value: String(numChunks)
      });
      tags.push({
        key: 'chunkNumber',
        value: String(chunkNumber)
      });
    }
    return this.ecs!.runTask({
      cluster: process.env.FARGATE_CLUSTER_NAME!,
      taskDefinition: process.env.FARGATE_TASK_DEFINITION_NAME!,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'ENABLED',
          securityGroups: [process.env.FARGATE_SG_ID!],
          subnets: [process.env.FARGATE_SUBNET_ID!]
        }
      },
      platformVersion: '1.4.0',
      launchType: 'FARGATE',
      // TODO: enable tags when we are able to opt in to the new ARN format for the lambda IAM role.
      // See https://aws.amazon.com/blogs/compute/migrating-your-amazon-ecs-deployment-to-the-new-arn-and-resource-id-format-2/
      // tags,
      overrides: {
        cpu,
        memory,
        containerOverrides: [
          {
            name: 'main', // from task definition
            environment: [
              {
                name: 'CROSSFEED_COMMAND_OPTIONS',
                value: JSON.stringify(commandOptions)
              },
              {
                name: 'DB_HOST',
                value: process.env.DB_HOST
              },
              {
                name: 'DB_PORT',
                value: process.env.DB_PORT
              },
              {
                name: 'DB_USERNAME',
                value: process.env.DB_USERNAME
              },
              {
                name: 'DB_PASSWORD',
                value: process.env.DB_PASSWORD
              },
              {
                name: 'CENSYS_API_ID',
                value: process.env.CENSYS_API_ID
              },
              {
                name: 'CENSYS_API_SECRET',
                value: process.env.CENSYS_API_SECRET
              }
            ]
          }
        ]
      }
    } as ECS.RunTaskRequest).promise();
  }

  /**
   * Gets logs for a specific task.
   */
  async getLogs(fargateTaskArn: string) {
    if (this.isLocal) {
      const logStream = await this.docker?.getContainer(fargateTaskArn).logs({
        stdout: true,
        stderr: true,
        timestamps: true
      });
      // Remove 8 special characters at beginning of Docker logs -- see
      // https://github.com/moby/moby/issues/7375.
      return logStream
        ?.toString()
        .split('\n')
        .map((e) => e.substring(8))
        .join('\n');
    } else {
      const response = await this.cloudWatchLogs!.getLogEvents({
        logGroupName: process.env.FARGATE_LOG_GROUP_NAME!,
        logStreamName: `worker/main/${fargateTaskArn}`,
        startFromHead: true
      }).promise();
      const res = response.$response.data;
      if (!res || !res.events?.length) {
        return '';
      }
      return res.events
        .map((e) => `${new Date(e.timestamp!).toISOString()} ${e.message}`)
        .join('\n');
    }
  }

  /**
   * Retrieves the number of running tasks associated
   * with the Fargate worker.
   */
  async getNumTasks() {
    if (this.isLocal) {
      const containers = await this.docker?.listContainers({
        filters: {
          ancestor: ['crossfeed-worker']
        }
      });
      return containers?.length || 0;
    }
    const tasks = await this.ecs
      ?.listTasks({
        cluster: process.env.FARGATE_CLUSTER_NAME,
        launchType: 'FARGATE'
      })
      .promise();
    return tasks?.taskArns?.length || 0;
  }
}

export default ECSClient;
