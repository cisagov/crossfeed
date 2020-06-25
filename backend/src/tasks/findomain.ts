import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain, Organization } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { saveDomainToDb } from './helpers';

const LAYER_PATH = process.env.IS_LOCAL ? '/app/layers' : '/opt';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  if (process.env.IS_LOCAL) {
    spawnSync('chmod', ['+x', LAYER_PATH + '/findomain/findomain'], {
      stdio: 'pipe'
    });
  }

  let organizations = await Organization.find();
  let allDomains = [].concat.apply(
    [],
    organizations.map((org) => org.rootDomains)
  );

  let count = 0;
  for (let rootDomain of allDomains) {
    spawnSync(
      LAYER_PATH + '/findomain/findomain',
      ['-it', rootDomain, '-u', '/tmp/out.txt'],
      { stdio: 'pipe' }
    );

    let output = String(readFileSync(`/tmp/out.txt`));
    let lines = output.split('\n');
    for (let line of lines) {
      if (line == '') continue;
      let parsedDomain = new Domain();
      let split = line.split(',');
      parsedDomain.name = split[0];
      parsedDomain.ip = split[1];
      await saveDomainToDb(parsedDomain);
      count++;
    }
  }
  console.log(`Findomain created/updated ${count} new domains`);
};
