import { Domain } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as path from 'path';

const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.txt');

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running amass on organization', organizationName);

  const rootDomains = await getRootDomains(organizationId!);

  for (const rootDomain of rootDomains) {
    try {
      const args = [
        'enum',
        '-ip',
        '-active',
        '-d',
        rootDomain,
        '-json',
        OUT_PATH
      ];
      console.log('Running amass with args', args);
      spawnSync('amass', args, { stdio: 'pipe' });
      const output = String(readFileSync(OUT_PATH));
      const lines = output.split('\n');
      const domains: Domain[] = [];
      for (const line of lines) {
        if (line == '') continue;
        const parsed = JSON.parse(line);
        domains.push(
          plainToClass(Domain, {
            ip: parsed.addresses[0].ip,
            name: parsed.name,
            asn: parsed.addresses[0].asn,
            organization: { id: organizationId },
            fromRootDomain: rootDomain,
            subdomainSource: 'amass',
            discoveredBy: { id: scanId }
          })
        );
      }
      await saveDomainsToDb(domains);
      console.log(`amass created/updated ${domains.length} new domains`);
    } catch (e) {
      console.error(e);
      continue;
    }
  }
};
