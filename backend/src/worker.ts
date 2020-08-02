import { CommandOptions } from './tasks/ecs-client';
import { connectToDatabase, ScanTask } from './models';
import { handler as amass } from './tasks/amass';
import { handler as censys } from './tasks/censys';
import { handler as findomain } from './tasks/findomain';
import { handler as portscanner } from './tasks/portscanner';
import { handler as wappalyzer } from './tasks/wappalyzer';
import { handler as censysIpv4 } from './tasks/censysIpv4';
import { handler as cve } from './tasks/cve';

/**
 * Worker entrypoint.
 */
async function main() {
  await connectToDatabase();

  const commandOptions: CommandOptions = JSON.parse(
    process.env.CROSSFEED_COMMAND_OPTIONS || '{}'
  );
  console.log('commandOptions are', commandOptions);

  const { scanName, scanTaskId } = commandOptions;
  const scanTask = await ScanTask.findOneOrFail(scanTaskId);

  scanTask.status = 'started';
  scanTask.startedAt = new Date();
  await scanTask.save();

  try {
    const scanFn = {
      amass,
      censys,
      censysIpv4,
      cve,
      findomain,
      portscanner,
      wappalyzer
    }[scanName];
    if (!scanFn) {
      throw new Error('Invalid scan name ' + scanName);
    }
    await scanFn(commandOptions);
    scanTask.status = 'finished';
  } catch (e) {
    console.error(e);
    scanTask.status = 'failed';
    scanTask.output = JSON.stringify(e);
  } finally {
    scanTask.finishedAt = new Date();
    await scanTask.save();
  }
}

main();
