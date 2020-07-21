import { ECS } from 'aws-sdk';
import { SCAN_SCHEMA } from '../api/scans';

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
  docker?: any;
  isLocal: boolean;

  constructor() {
    this.isLocal =
      process.env.IS_OFFLINE || process.env.IS_LOCAL ? true : false;
    this.isLocal = false;
    if (this.isLocal) {
      const Docker = require('dockerode');
      this.docker = new Docker();
    } else {
      this.ecs = new ECS({ region: 'us-east-1' });
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
    if (this.isLocal) {
      try {
        const container = await this.docker!.createContainer({
          // We need to create unique container names to avoid conflicts.
          name: toSnakeCase(
            `crossfeed_worker_${organizationName}_${scanName}_` +
              Math.floor(Math.random() * 10000000)
          ),
          Image: 'crossfeed-worker',
          Env: [
            `CROSSFEED_COMMAND_OPTIONS=${JSON.stringify(commandOptions)}`,
            `DB_DIALECT=${process.env.DB_DIALECT}`,
            `DB_HOST=localhost`,
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
        });
        await container.start();
        return {
          tasks: [{}],
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
    const { cpu, memory } = SCAN_SCHEMA[scanName];
    const tags =  [
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
      tags.push(      {
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
          securityGroups: ['sg-05c9168f323c60ade'], // lambda sg id
          subnets: ['subnet-02b249dd78cef0faf'] // ['subnet-005633f93180b0beb'] // // subnet id
        }
      },
      platformVersion: '1.4.0',
      launchType: 'FARGATE',
      tags,
      overrides: {
        // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
        // https://stormforger.com/blog/aws-fargate-network-performance/
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
}

export default ECSClient;
