import { Domain, Service, Vulnerability } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { spawnSync } from 'child_process';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running dnstwist on organization', organizationName);
  const domainsWithIPs = await getIps(organizationId);

  const vulns: Vulnerability[] = [];
  for (const domain of domainsWithIPs) {
    try {
      console.log(domain.name);
      var child = spawnSync(
        'dnstwist',
        ['-r', '--tld', './worker/common_tlds.dict', '-f', 'json', domain.name],
        {
          cwd: process.cwd(),
          env: process.env,
          stdio: 'pipe',
          encoding: 'utf-8'
        }
      );
      var savedOutput = String(child.stdout);
      const results = JSON.parse(savedOutput);
      console.log(
        `Got ${Object.keys(results).length} similar domains for domain ${domain.name}`
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
            structuredData: { domains: results },
            description: `Registered domains similar to ${domain.name}.`
          })
        );
        await saveVulnerabilitiesToDb(vulns, false);
        console.log(results);
      }
      else {
        continue;
      }
    } catch (e) {
      console.error(e);
      continue;
    }
  }
};
