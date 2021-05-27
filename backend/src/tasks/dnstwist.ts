import { Domain, Vulnerability } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { spawnSync } from 'child_process';

async function runDNSTwist(domain: Domain) {
  console.log(domain.name);
  const child = spawnSync(
    'dnstwist',
    [
      '-w',
      '-r',
      '--tld',
      './worker/common_tlds.dict',
      '-f',
      'json',
      domain.name
    ],
    {
      stdio: 'pipe',
      encoding: 'utf-8'
    }
  );
  const savedOutput = String(child.stdout);
  const finalResults = JSON.parse(savedOutput);
  console.log(
    `Got ${Object.keys(finalResults).length} similar domains for domain ${
      domain.name
    }`
  );
  return finalResults;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running dnstwist on organization', organizationName);
  const domainsWithIPs = await getIps(organizationId);

  const vulns: Vulnerability[] = [];
  for (const domain of domainsWithIPs) {
    try {
      const results = await runDNSTwist(domain);
      if (Object.keys(results).length !== 0) {
        vulns.push(
          plainToClass(Vulnerability, {
            domain: domain,
            lastSeen: new Date(Date.now()),
            title: 'DNSTwist Domains',
            state: 'open',
            source: 'dnstwist',
            needsPopulation: false,
            structuredData: { domains: results },
            description: `Registered domains similar to ${domain.name}.`
          })
        );
        await saveVulnerabilitiesToDb(vulns, false);
      } else {
        continue;
      }
    } catch (e) {
      console.error(e);
      continue;
    }
  }
};
