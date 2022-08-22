import { connectToDatabase, Domain, Vulnerability } from '../models';
import getRootDomains from './helpers/getRootDomains';
import { CommandOptions } from './ecs-client';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { spawnSync } from 'child_process';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as dns from 'dns';

async function runDNSTwist(domain: string) {
  const child = spawnSync(
    'dnstwist',
    ['-r', '--tld', './worker/common_tlds.dict', '-f', 'json', domain],
    {
      stdio: 'pipe',
      encoding: 'utf-8'
    }
  );
  const savedOutput = child.stdout;
  const finalResults = JSON.parse(savedOutput);
  console.log(
    `Got ${
      Object.keys(finalResults).length
    } similar domains for root domain ${domain}`
  );
  return finalResults;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  await connectToDatabase();
  const dateNow = new Date(Date.now());
  console.log('Running dnstwist on organization', organizationName);
  const root_domains = await getRootDomains(organizationId!);
  const vulns: Vulnerability[] = [];
  console.log('Root domains:', root_domains);
  for (const root_domain of root_domains) {
    try {
      const results = await runDNSTwist(root_domain);

      // Fetch existing domain object
      let domain = await Domain.findOne({
        organization: { id: organizationId },
        name: root_domain
      });

      if (!domain) {
        let ipAddress;
        const new_domain: Domain[] = [];
        try {
          ipAddress = (await dns.promises.lookup(root_domain)).address;
        } catch (e) {
          ipAddress = null;
        }
        new_domain.push(
          plainToClass(Domain, {
            name: root_domain,
            ip: ipAddress,
            organization: { id: organizationId }
          })
        );
        await saveDomainsToDb(new_domain);
        domain = await Domain.findOne({
          organization: { id: organizationId },
          name: root_domain
        });
      }

      // Fetch existing dnstwist vulnerability
      const existingVuln = await Vulnerability.findOne({
        domain: { id: domain?.id },
        source: 'dnstwist'
      });

      // Map date-first-observed to any domain-name that already exists
      const existingVulnsMap = {};
      if (existingVuln) {
        for (const domain of existingVuln.structuredData['domains']) {
          existingVulnsMap[domain['domain']] = domain['date_first_observed'];
        }
      }
      // If an existing domain-name is in the new results, set date-first-observed to the mapped value
      // Else, set date-first-observed to today's date (dateNow)
      for (const domain of results) {
        domain['date_first_observed'] =
          existingVulnsMap[domain['domain']] || dateNow;
      }
      if (Object.keys(results).length !== 0) {
        vulns.push(
          plainToClass(Vulnerability, {
            domain: domain,
            lastSeen: new Date(Date.now()),
            title: 'DNS Twist Domains',
            state: 'open',
            source: 'dnstwist',
            severity: 'Low',
            needsPopulation: false,
            structuredData: { domains: results },
            description: `Registered domains similar to ${root_domain}.`
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
