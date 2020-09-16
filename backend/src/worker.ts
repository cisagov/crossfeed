import 'global-agent/bootstrap'; // proxy
import { CommandOptions } from './tasks/ecs-client';
import { handler as amass } from './tasks/amass';
import { handler as censys } from './tasks/censys';
import { handler as findomain } from './tasks/findomain';
import { handler as portscanner } from './tasks/portscanner';
import { handler as wappalyzer } from './tasks/wappalyzer';
import { handler as censysIpv4 } from './tasks/censysIpv4';
import { handler as intrigueIdent } from './tasks/intrigue-ident';
import { handler as cve } from './tasks/cve';
import { handler as testProxy } from './tasks/test-proxy';

/**
 * Worker entrypoint.
 */
async function main() {
  const commandOptions: CommandOptions = JSON.parse(
    process.env.CROSSFEED_COMMAND_OPTIONS || '{}'
  );
  console.log('commandOptions are', commandOptions);

  const { scanName } = commandOptions;

  const scanFn = {
    amass,
    censys,
    censysIpv4,
    cve,
    findomain,
    portscanner,
    wappalyzer,
    intrigueIdent,
    testProxy
  }[scanName || 'testProxy'];
  if (!scanFn) {
    throw new Error('Invalid scan name ' + scanName);
  }

  await scanFn(commandOptions);
}

main();
