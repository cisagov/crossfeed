import { ECS } from "aws-sdk";
import * as Docker from "dockerode";

export interface CommandOptions {
  organizationId: string,
  organizationName: string,
  scanId: string,
  scanName: string
}

/**
 * ECS Client. Normally, submits jobs to ECS.
 * When the app is running locally, runs a
 * Docker container locally instead.
 */
class ECSClient {
  ecs?: ECS
  docker?: any
  isLocal: boolean

  constructor() {
    this.isLocal = (process.env.IS_OFFLINE || process.env.IS_LOCAL) ? true : false;
    // this.isLocal = false;
    if (this.isLocal) {
      this.docker = new Docker();
    } else {
      this.ecs = new ECS();
    }
  }

  /**
   * Launches an ECS task with the given command.
   * @param command Command to run (array of strings)
   */
  async runCommand(commandOptions: CommandOptions) {
    if (this.isLocal) {
      const container = await this.docker!.createContainer({
        Image: "crossfeed-worker",
        Env: [
          `CROSSFEED_COMMAND_OPTIONS=${JSON.stringify(commandOptions)}`,
          `DB_DIALECT=${process.env.DB_DIALECT}`,
          `DB_HOST=localhost`,
          `DB_PORT=${process.env.DB_PORT}`,
          `DB_NAME=${process.env.DB_NAME}`,
          `DB_USERNAME=${process.env.DB_USERNAME}`,
          `DB_PASSWORD=${process.env.DB_PASSWORD}`,
        ],
        NetworkMode: "host"
      });
      await container.start();
      return {
        tasks: [
          {}
        ]
      };
    }
    const { scanId, scanName, organizationId, organizationName } = commandOptions;
    return this.ecs!.runTask({
      cluster: "crossfeed-staging-worker", // aws_ecs_cluster.worker.name
      taskDefinition: "crossfeed-staging-worker", // aws_ecs_task_definition.worker.name
      networkConfiguration: {
        awsvpcConfiguration: {
          securityGroups: ["sg-088b4691e1cafd8c0"], // lambda sg id
          subnets: ["subnet-005633f93180b0beb"], // subnet id
        }
      },
      platformVersion: "1.4.0",
      launchType: "FARGATE",
      tags: [
        {
          key: "scanId",
          value: scanId
        },
        {
          key: "scanName",
          value: scanName
        },
        {
          key: "organizationId",
          value: organizationId,
        },
        {
          key: "organizationName",
          value: organizationName
        }
      ],
      overrides: {
        containerOverrides: [
          {
            name: "main", // from task definition
            environment: [
              {
                name: "CROSSFEED_COMMAND_OPTIONS",
                value: JSON.stringify(commandOptions)
              },
              {
                name: "DB_DIALECT",
                value: process.env.DB_DIALECT
              },
              {
                name: "DB_HOST",
                value: process.env.DB_HOST
              },
              {
                name: "DB_PORT",
                value: process.env.DB_PORT
              },
              {
                name: "DB_NAME",
                value: process.env.DB_NAME
              },
              {
                name: "DB_USERNAME",
                value: process.env.DB_USERNAME
              },
              {
                name: "DB_PASSWORD",
                value: process.env.DB_PASSWORD
              }
            ]
          }
        ]
      }
    } as ECS.RunTaskRequest).promise();
  }
}

export default ECSClient;