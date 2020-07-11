import { CommandOptions } from './tasks/ecs-client';
import { connectToDatabase } from './models';
import findomain from './tasks/findomain';

/**
 * Worker entrypoint.
 */
async function main() {
  await connectToDatabase();

  const commandOptions: CommandOptions = JSON.parse(
    process.env.CROSSFEED_COMMAND_OPTIONS || '{}'
  );
  console.error('commandOptions are', commandOptions);

  const { scanName } = commandOptions;

  switch (scanName) {
    case 'findomain':
      await findomain(commandOptions);
      break;
    default:
      throw 'Invalid scan name ' + scanName;
  }
}

main();
