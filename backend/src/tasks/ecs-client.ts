import { ECS } from 'aws-sdk';
import * as Docker from 'dockerode';

export interface CommandOptions {
  organizationId: string;
  organizationName: string;
  scanId: string;
  scanName: string;
}

const toSnakeCase = input => input.replace(/ /g, "-");

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
    // this.isLocal = false;
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
      organizationName
    } = commandOptions;
    if (this.isLocal) {
      try {
        const container = await this.docker!.createContainer({
          // We need to create unique container names to avoid conflicts.
          name: toSnakeCase(`crossfeed_worker_${organizationName}_${scanName}_` + (Math.floor(Math.random() * 100000))),
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
    // TODO: retrieve these values from SSM.
    return this.ecs!.runTask({
      cluster: 'crossfeed-staging-worker', // aws_ecs_cluster.worker.name
      taskDefinition: 'crossfeed-staging-worker', // aws_ecs_task_definition.worker.name
      networkConfiguration: {
        awsvpcConfiguration: {
          securityGroups: ['sg-088b4691e1cafd8c0'], // lambda sg id
          subnets: ['subnet-005633f93180b0beb'] // subnet id
        }
      },
      platformVersion: '1.4.0',
      launchType: 'FARGATE',
      tags: [
        {
          key: 'scanId',
          value: scanId
        },
        {
          key: 'scanName',
          value: scanName
        },
        {
          key: 'organizationId',
          value: organizationId
        },
        {
          key: 'organizationName',
          value: organizationName
        }
      ],
      overrides: {
        containerOverrides: [
          {
            name: 'main', // from task definition
            environment: [
              {
                name: 'CROSSFEED_COMMAND_OPTIONS',
                value: JSON.stringify(commandOptions)
              }
            ]
          }
        ]
      }
    } as ECS.RunTaskRequest).promise();
  }
}

export default ECSClient;
