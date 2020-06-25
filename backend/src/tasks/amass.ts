import { Handler } from 'aws-lambda';
import { connectToDatabase, Organization } from '../models';
import { spawnSync } from 'child_process';
const { readFileSync, writeFileSync } = require('fs');

const LAYER_PATH = process.env.IS_LOCAL ? '/app/layers' : '/opt';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  let organizations = await Organization.find();
  let allDomains = [].concat.apply(
    [],
    organizations.map((org) => org.rootDomains)
  );

  console.log('Starting Amass');

  spawnSync(
    LAYER_PATH + '/amass/amass',
    [
      'enum',
      '-passive',
      '-d',
      'lightningsecurity.io',
      '-json',
      '/tmp/out.json'
    ],
    { stdio: 'inherit' }
  );

  const output = readFileSync(`/tmp/out.json`);
  console.log(String(output));
};
