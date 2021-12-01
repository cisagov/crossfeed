import { ECS, CloudWatchLogs } from 'aws-sdk';
import { SCAN_SCHEMA } from '../api/scans';

export interface CommandOptions {
  /** A list of organizations (id and name) that this
   * ScanTask must run on. */
  organizations?: {
    name: string;
    id: string;
  }[];

  scanId: string;
  scanName: string;
  scanTaskId: string;
  chunkNumber?: number;
  numChunks?: number;

  // Used only for testing to scope down global scans to a single domain.
  domainId?: string;

  /** These properties are not specified when creating a ScanTask (as a single ScanTask
   * can correspond to multiple organizations), but they are input into the the
   * specific task function that runs per organization.
   */
  organizationId?: string;
  organizationName?: string;
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
  docker?: any;
  isLocal: boolean;

  constructor(isLocal?: boolean) {
    this.isLocal =
      isLocal ??
      (process.env.IS_OFFLINE || process.env.IS_LOCAL ? true : false);
    if (this.isLocal) {
      const Docker = require('dockerode');
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
          HostConfig: {
            // In order to use the host name "db" to access the database from the
            // crossfeed-worker image, we must launch the Docker container with
            // the Crossfeed backend network.
            NetworkMode: 'crossfeed_backend',
            Memory: 4000000000 // Limit memory to 4 GB. We do this locally to better emulate fargate memory conditions. TODO: In the future, we could read the exact memory from SCAN_SCHEMA to better emulate memory requirements for each scan.
          },
          Env: [
            `CROSSFEED_COMMAND_OPTIONS=${JSON.stringify(commandOptions)}`,
            `DB_DIALECT=${process.env.DB_DIALECT}`,
            `DB_HOST=${process.env.DB_HOST}`,
            `IS_LOCAL=true`,
            `DB_PORT=${process.env.DB_PORT}`,
            `DB_NAME=${process.env.DB_NAME}`,
            `DB_USERNAME=${process.env.DB_USERNAME}`,
            `DB_PASSWORD=${process.env.DB_PASSWORD}`,
            `CENSYS_API_ID=${process.env.CENSYS_API_ID}`,
            `CENSYS_API_SECRET=${process.env.CENSYS_API_SECRET}`,
            `WORKER_USER_AGENT=${process.env.WORKER_USER_AGENT}`,
            `SHODAN_API_KEY=${process.env.SHODAN_API_KEY}`,
            `HIBP_API_KEY=${process.env.HIBP_API_KEY}`,
            `WORKER_SIGNATURE_PUBLIC_KEY=${process.env.WORKER_SIGNATURE_PUBLIC_KEY}`,
            `WORKER_SIGNATURE_PRIVATE_KEY=${process.env.WORKER_SIGNATURE_PRIVATE_KEY}`,
            `ELASTICSEARCH_ENDPOINT=${process.env.ELASTICSEARCH_ENDPOINT}`,
            `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
            `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
            `LG_API_KEY=${process.env.LG_API_KEY}`,
            `LG_WORKSPACE_NAME=${process.env.LG_WORKSPACE_NAME}`
          ]
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
                // Allow node to use more memory, if needed
                name: 'NODE_OPTIONS',
                value: memory ? `--max_old_space_size=${memory}` : ''
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
        // Pick the ID from "arn:aws:ecs:us-east-1:957221700844:task/crossfeed-staging-worker/f59d71c6-3d23-4ee9-ad68-c7b810bf458b"
        logStreamName: `worker/main/${fargateTaskArn.split('/')[2]}`,
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
