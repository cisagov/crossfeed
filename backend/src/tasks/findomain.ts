import { connectToDatabase, Domain, Organization } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { saveDomainToDb } from './helpers';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';

const OUT_PATH = 'out.txt';

export default async (commandOptions: CommandOptions) => {
  await connectToDatabase();

  const { organizationId, organizationName } = commandOptions;

  console.log("Running findomain on organization", organizationName);

  const organization = await Organization.findOne(organizationId);
  const { rootDomains } = organization!;
  
  for (let rootDomain of rootDomains) {
    let count = 0;
    const args = ['-it', rootDomain, '-u', OUT_PATH];
    console.log("Running findomain with args", args);
    spawnSync(
      'findomain',
      args,
      { stdio: 'pipe' }
    );

    const output = String(readFileSync(OUT_PATH));
    const lines = output.split('\n');
    for (const line of lines) {
      if (line == '') continue;
      const split = line.split(',');
      await saveDomainToDb(
        plainToClass(Domain, {
          name: split[0],
          ip: split[1],
          organization: organization
        })
      );
      count++;
    }
    console.log(`Findomain created/updated ${count} new domains`);
  }
};
