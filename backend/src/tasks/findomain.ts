import { connectToDatabase, Domain } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getDomains from './helpers/getDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';

const OUT_PATH = 'out.txt';

export default async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log("Running findomain on organization", organizationName);

  const rootDomains = await getDomains(organizationId);
  
  for (let rootDomain of rootDomains) {
    const args = ['-it', rootDomain, '-u', OUT_PATH];
    console.log("Running findomain with args", args);
    spawnSync(
      'findomain',
      args,
      { stdio: 'pipe' }
    );

    const output = String(readFileSync(OUT_PATH));
    const lines = output.split('\n');
    const domains: Domain[] = [];
    for (const line of lines) {
      if (line == '') continue;
      const split = line.split(',');
      domains.push(plainToClass(Domain, {
        name: split[0],
        ip: split[1],
        organization: organizationId
      }));
    }
    await saveDomainsToDb(domains);
    console.log(`Findomain created/updated ${domains.length} new domains`);
    unlinkSync(OUT_PATH);
  }
};
