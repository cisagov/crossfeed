import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { connectToDatabase, Organization, Vulnerability } from '../models';
import * as path from 'path';
import { writeFileSync } from 'fs';
import { getPeEnv } from './helpers/getPeEnv';

const HIBP_SYNC_DIRECTORY = '/app/worker/pe_scripts/hibpSyncFiles';
// Sync Crossfeed's hibp data with PE's db instance

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  await connectToDatabase();
  const vulnerabilities = await Vulnerability.createQueryBuilder('vuln')
    .select('vuln.structuredData', 'structuredData')
    .addSelect('dom.fromRootDomain', 'fromRootDomain')
    .addSelect('dom.name', 'name')
    .innerJoin('vuln.domain', 'dom')
    .where('dom.organizationId = :org_id', { org_id: organizationId })
    .andWhere("vuln.source = 'hibp'")
    .getRawMany();

  const INPUT_PATH = path.join(HIBP_SYNC_DIRECTORY, organizationId + '.json');
  writeFileSync(INPUT_PATH, JSON.stringify(vulnerabilities));
  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sync_hibp_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...getPeEnv(),
        data_path: INPUT_PATH,
        org_name: organizationName,
        org_id: organizationId
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
