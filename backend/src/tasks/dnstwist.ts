import { connectToDatabase, Domain, Vulnerability } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { spawnSync } from 'child_process';

async function runDNSTwist(domain: Domain) {
  console.log(domain.name);
  const child = spawnSync(
    'dnstwist',
    ['-r', '--tld', './worker/common_tlds.dict', '-f', 'json', domain.name],
    {
      stdio: 'pipe',
      encoding: 'utf-8'
    }
  );
  const savedOutput = child.stdout;
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

  await connectToDatabase;
  const date = new Date(Date.now());
  console.log('Running dnstwist on organization', organizationName);
  const domainsWithIPs = await getIps(organizationId);

  const vulns: Vulnerability[] = [];
  for (const domain of domainsWithIPs) {
    try {
      const results = await runDNSTwist(domain);
      const existingVulns = await Vulnerability.find({
        domain: { id: domain.id },
        source: 'dnstwist'
      });
      let existingDomains: object[] = [];
      const newDomainNames: String[] = [];
      if (existingVulns.length > 0) {
        existingDomains = existingVulns[0].structuredData['domains'];
      }
      for (const newDomain of results) {
        newDomain['date-observed'] = date;
        newDomainNames.push(newDomain['domain-name']);

        if (!existingDomains) {
          existingDomains = [newDomain];
          // else if dnstwist domain has already been added
        } else if (
          existingDomains.some(
            (oldDomain) => oldDomain['domain-name'] === newDomain['domain-name']
          )
        ) {
          continue;
        } else {
          existingDomains.push(newDomain);
        }
      }
      //filter out any domains that no longer exist
      const finalResults = existingDomains.filter((domain) =>
        newDomainNames.includes(domain['domain-name'])
      );

      if (Object.keys(results).length !== 0) {
        vulns.push(
          plainToClass(Vulnerability, {
            domain: domain,
            lastSeen: new Date(Date.now()),
            title: 'DNSTwist Domains',
            state: 'open',
            source: 'dnstwist',
            needsPopulation: false,
            structuredData: { domains: finalResults },
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
