import { CommandOptions } from './tasks/ecs-client';
import { connectToDatabase } from './models';
import { handler as amass } from './tasks/amass';
import { handler as findomain } from './tasks/findomain';
import { handler as portscanner } from './tasks/portscanner';

/**
 * Worker entrypoint.
 */
async function main() {
  await connectToDatabase();

  const commandOptions: CommandOptions = JSON.parse(
    process.env.CROSSFEED_COMMAND_OPTIONS || '{}'
  );
  console.log('commandOptions are', commandOptions);

  const { scanName } = commandOptions;

  const scanFn = { amass, findomain, portscanner }[scanName];

  if (!scanFn) {
    throw new Error('Invalid scan name ' + scanName);
  }

  await scanFn(commandOptions);
}

main();
