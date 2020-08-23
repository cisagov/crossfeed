import { ECS } from 'aws-sdk';
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
    // TODO: retrieve these values from SSM.
    return this.ecs!.runTask({
      cluster: 'crossfeed-staging-worker', // aws_ecs_cluster.worker.name
      taskDefinition: 'crossfeed-staging-worker', // aws_ecs_task_definition.worker.name
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
        cluster: 'crossfeed-staging-worker',
        launchType: 'FARGATE'
      })
      .promise();
    return tasks?.taskArns?.length || 0;
  }
}

export default ECSClient;

/**

[
  {
    Id: '63eaa36a2c7647ddda10f0a69a77ec6fcf19aa34d7c81eb2d0db91054e692da6',
    Names: [ '/crossfeed_backend_1' ],
    Image: 'crossfeed_backend',
    ImageID: 'sha256:2549cb8e477fc0999d8ee5f0e3c1a4a1d7300a7f84e550dd3baf5c40a70e089a',
    Command: 'docker-entrypoint.sh npx ts-node-dev src/api-dev.ts',
    Created: 1598133651,
    Ports: [ [Object] ],
    Labels: {
      'com.docker.compose.config-hash': 'd91655ed853821d450e1a6be368a02216a73984da23bbd23d957ff5dfae26abd',
      'com.docker.compose.container-number': '1',
      'com.docker.compose.oneoff': 'False',
      'com.docker.compose.project': 'crossfeed',
      'com.docker.compose.project.config_files': 'docker-compose.yml',
      'com.docker.compose.project.working_dir': '/Users/ramaswania/crossfeed',
      'com.docker.compose.service': 'backend',
      'com.docker.compose.version': '1.26.2'
    },
    State: 'running',
    Status: 'Up 3 hours',
    HostConfig: { NetworkMode: 'crossfeed_default' },
    NetworkSettings: { Networks: [Object] },
    Mounts: [ [Object], [Object] ]
  }
]

{
  taskArns: [
    'arn:aws:ecs:us-east-1:957221700844:task/dfd16a90-f944-4387-953f-694071ae95b6'
  ]
}

 */
