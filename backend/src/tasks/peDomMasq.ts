import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { connectToDatabase, Vulnerability } from '../models';
import * as path from 'path';
import { writeFileSync } from 'fs';

const DOM_MASQ_DIRECTORY = '/app/worker/pe_scripts/peDomMasq';
// Call the sync_dnstwist_pe.py script that fetches dnstwist results, checks
// IPs using the blocklist.de api, then updates the PE db instance

function gePeEnv() {
  const peCredentials = {
    DB_HOST: process.env.DB_HOST,
    PE_DB_NAME: process.env.PE_DB_NAME,
    PE_DB_USERNAME: process.env.PE_DB_USERNAME,
    PE_DB_PASSWORD: process.env.PE_DB_PASSWORD
  };
  return JSON.stringify(peCredentials);
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  await connectToDatabase();
  const data = await Vulnerability.createQueryBuilder('vulnerability')
    .select('vulnerability.structuredData', 'structuredData')
    .addSelect('vulnerability.domainId')
    .addSelect('domain.name', 'name')
    .innerJoin('vulnerability.domain', 'domain')
    .where('domain.organizationId = :org_id', { org_id: organizationId })
    .andWhere("vulnerability.source = 'dnstwist'")
    .getRawMany();
  console.log(data);
  const file_name = organizationName?.replace(/ /g, '');
  const input_path = path.join(DOM_MASQ_DIRECTORY, file_name + '.json');
  console.log(input_path);
  writeFileSync(input_path, JSON.stringify(data));

  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sync_dnstwist_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        peCreds: gePeEnv(),
        data_path: input_path,
        org_id: organizationId,
        org_name: organizationName
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
