import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain, Organization } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { saveDomainToDb, getRootDomains } from './helpers';
import { plainToClass } from 'class-transformer';

const LAYER_PATH =
  process.env.IS_OFFLINE || process.env.IS_LOCAL ? '/app/layers' : '/opt';
const OUT_PATH =
  process.env.IS_OFFLINE || process.env.IS_LOCAL ? 'out.json' : '/tmp/out.json';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  if (process.env.IS_OFFLINE || process.env.IS_LOCAL) {
    spawnSync('chmod', ['+x', LAYER_PATH + '/findomain/findomain'], {
      stdio: 'pipe'
    });
  }

  const allDomains = await getRootDomains(true);
  let count = 0;
  for (const rootDomain of allDomains) {
    spawnSync(
      LAYER_PATH + '/findomain/findomain',
      ['-it', rootDomain.name, '-u', OUT_PATH],
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
          isPassive: rootDomain.isPassive
        })
      );
      count++;
    }
  }
  console.log(`Findomain created/updated ${count} new domains`);
};
