import { Handler } from 'aws-lambda';
import { connectToDatabase, Organization, Domain } from '../models';
import { spawnSync } from 'child_process';
import { plainToClass } from 'class-transformer';
import { saveDomainToDb } from './helpers';
import { readFileSync } from 'fs';

const LAYER_PATH = process.env.IS_LOCAL ? '/app/layers' : '/opt';
const OUT_PATH = process.env.IS_LOCAL ? 'out.json' : '/tmp/out.json';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const organizations = await Organization.find();
  let allDomains: string[] = [];
  for (const org of organizations)
    allDomains = allDomains.concat(org.rootDomains);

  let count = 0;
  for (const rootDomain of allDomains) {
    spawnSync(
      LAYER_PATH + '/amass/amass',
      ['enum', '-ip', '-active', '-d', rootDomain, '-json', OUT_PATH],
      { stdio: 'inherit' }
    );

    const output = String(readFileSync(OUT_PATH));
    const lines = output.split('\n');
    for (const line of lines) {
      if (line == '') continue;
      const parsed = JSON.parse(line);
      await saveDomainToDb(
        plainToClass(Domain, {
          ip: parsed.addresses[0].ip, //TODO: store multiple IPs per domain
          name: parsed.name,
          asn: parsed.addresses[0].asn
        })
      );
      count++;
      console.log('Saved ' + parsed.name);
    }
  }
  console.log(`Amass created/updated ${count} new domains`);
};
