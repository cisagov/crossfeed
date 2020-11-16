import { bootstrap } from 'global-agent';
import { CommandOptions } from './tasks/ecs-client';
import { handler as amass } from './tasks/amass';
import { handler as censys } from './tasks/censys';
import { handler as findomain } from './tasks/findomain';
import { handler as portscanner } from './tasks/portscanner';
import { handler as wappalyzer } from './tasks/wappalyzer';
import { handler as censysIpv4 } from './tasks/censysIpv4';
import { handler as censysCertificates } from './tasks/censysCertificates';
import { handler as sslyze } from './tasks/sslyze';
import { handler as searchSync } from './tasks/search-sync';
import { handler as intrigueIdent } from './tasks/intrigue-ident';
import { handler as nuclei } from './tasks/nuclei';
import { handler as cve } from './tasks/cve';
import { handler as webscraper } from './tasks/webscraper';
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
    censysCertificates,
    sslyze,
    searchSync,
    cve,
    findomain,
    portscanner,
    wappalyzer,
    intrigueIdent,
    nuclei,
    webscraper,
    testProxy
  }[scanName || 'testProxy'];
  if (!scanFn) {
    throw new Error('Invalid scan name ' + scanName);
  }

  if (scanName === 'sslyze') {
    // No proxy
  } else {
    bootstrap();
  }

  await scanFn(commandOptions);
}

main();
