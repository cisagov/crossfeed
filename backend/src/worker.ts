import { CommandOptions } from "./tasks/ecs-client";

/**
 * Worker entrypoint.
 */
async function main() {
  const commandOptions: CommandOptions = JSON.parse(process.env.CROSSFEED_COMMAND_OPTIONS || "{}");
  console.error("commandOptions are", commandOptions);
}

main();