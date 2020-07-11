import { connectToDatabase, Domain } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';

const OUT_PATH = 'out-' + Math.random() + '.txt';

export default async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running amass on organization', organizationName);

  const rootDomains = await getRootDomains(organizationId);

  for (const rootDomain of rootDomains) {
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
          organization: organizationId
        })
      );
    }
    await saveDomainsToDb(domains);
    console.log(`amass created/updated ${domains.length} new domains`);
    unlinkSync(OUT_PATH);
  }
};
