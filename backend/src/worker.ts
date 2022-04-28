import { bootstrap } from 'global-agent';
import { CommandOptions } from './tasks/ecs-client';
import { handler as amass } from './tasks/amass';
import { handler as censys } from './tasks/censys';
import { handler as findomain } from './tasks/findomain';
import { handler as portscanner } from './tasks/portscanner';
import { handler as wappalyzer } from './tasks/wappalyzer';
import { handler as censysIpv4 } from './tasks/censysIpv4';
import { handler as censysCertificates } from './tasks/censysCertificates';
import { handler as savedSearch } from './tasks/saved-search';
import { handler as sslyze } from './tasks/sslyze';
import { handler as searchSync } from './tasks/search-sync';
import { handler as intrigueIdent } from './tasks/intrigue-ident';
import { handler as cve } from './tasks/cve';
import { handler as dotgov } from './tasks/dotgov';
import { handler as webscraper } from './tasks/webscraper';
import { handler as shodan } from './tasks/shodan';
import { handler as testProxy } from './tasks/test-proxy';
import { handler as hibp } from './tasks/hibp';
import { handler as peCybersixgill } from './tasks/peCybersixgill';
import { handler as lookingGlass } from './tasks/lookingGlass';
import { handler as dnstwist } from './tasks/dnstwist';
import { handler as rootDomainSync } from './tasks/rootDomainSync';
import { handler as peShodan } from './tasks/peShodan';
import { handler as peDomMasq } from './tasks/peDomMasq';
import { handler as peHibpSync } from './tasks/peHibpSync';
import { SCAN_SCHEMA } from './api/scans';

/**
 * Worker entrypoint.
 */
async function main() {
  const commandOptions: CommandOptions = JSON.parse(
    process.env.CROSSFEED_COMMAND_OPTIONS || '{}'
  );
  console.log('commandOptions are', commandOptions);

  const { scanName = 'testProxy', organizations = [] } = commandOptions;

  const scanFn = {
    amass,
    censys,
    censysIpv4,
    censysCertificates,
    sslyze,
    searchSync,
    cve,
    dotgov,
    findomain,
    portscanner,
    wappalyzer,
    intrigueIdent,
    webscraper,
    savedSearch,
    shodan,
    hibp,
    peCybersixgill,
    lookingGlass,
    dnstwist,
    testProxy,
    rootDomainSync,
    peShodan,
    peDomMasq,
    peHibpSync
  }[scanName];
  if (!scanFn) {
    throw new Error('Invalid scan name ' + scanName);
  }

  if (scanName === 'sslyze') {
    // No proxy
  } else {
    bootstrap();
  }

  const { global } = SCAN_SCHEMA[scanName];

  if (global) {
    await scanFn(commandOptions);
  } else {
    // For non-global scans, since a single ScanTask can correspond to
    // multiple organizations, we run scanFn for each particular
    // organization here by passing in the current organization's
    // name and id into commandOptions.
    for (const organization of organizations) {
      await scanFn({
        ...commandOptions,
        organizations: [],
        organizationId: organization.id,
        organizationName: organization.name
      });
    }
  }

  process.exit();
}

main();
