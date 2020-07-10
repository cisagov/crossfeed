import { ECS } from "aws-sdk";
import * as Docker from "dockerode";

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
  async runCommand(command) {
    if (this.isLocal) {
      await this.docker!.run("crossfeed-worker", command);
      return {
        tasks: []
      };
    }
    return this.ecs!.runTask({
      taskDefinition: "crossfeed-worker",
      overrides: {
        containerOverrides: [
          {
            command
          }
        ]
      }
    });
  }
}

export default ECSClient;