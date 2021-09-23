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

  console.log('Running findomain on organization', organizationName);

  const rootDomains = await getRootDomains(organizationId!);

  for (const rootDomain of rootDomains) {
    try {
      const args = [
        '--exclude-sources',
        'spyse',
        '-it',
        rootDomain,
        '-u',
        OUT_PATH
      ];
      console.log('Running findomain with args', args);
      spawnSync('findomain', args, { stdio: 'pipe' });
      const output = String(readFileSync(OUT_PATH));
      const lines = output.split('\n');
      const domains: Domain[] = [];
      for (const line of lines) {
        if (line == '') continue;
        const split = line.split(',');
        domains.push(
          plainToClass(Domain, {
            name: split[0],
            ip: split[1],
            organization: { id: organizationId },
            fromRootDomain: rootDomain,
            subdomainSource: 'findomain',
            discoveredBy: { id: scanId }
          })
        );
      }
      await saveDomainsToDb(domains);
      console.log(`Findomain created/updated ${domains.length} new domains`);
    } catch (e) {
      console.error(e);
      continue;
    }
  }
};
