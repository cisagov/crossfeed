import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { connectToDatabase, Vulnerability } from '../models';
import * as path from 'path';
import { promises as fs } from 'fs';
import { getPeEnv } from './helpers/getPeEnv';

const DOM_MASQ_DIRECTORY = '/app/worker/pe_scripts/peDomMasq';
// Call the sync_dnstwist_pe.py script that fetches dnstwist results, checks
// IPs using the blocklist.de api, then updates the PE db instance

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
  const input_path = path.join(DOM_MASQ_DIRECTORY, organizationId + '.json');

  await fs.writeFile(input_path, JSON.stringify(data));

  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sync_dnstwist_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...getPeEnv(),
        data_path: input_path,
        org_id: organizationId,
        org_name: organizationName
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
