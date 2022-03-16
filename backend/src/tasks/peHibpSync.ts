import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { connectToDatabase, Organization, Vulnerability } from '../models';
import * as path from 'path';
import { writeFileSync } from 'fs';

const HIBP_SYNC_DIRECTORY = '/app/worker/pe_scripts/hibpSyncFiles';
// Sync Crossfeed's hibp data with PE's db instance

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  await connectToDatabase(true);
  const INPUT_PATH = path.join(HIBP_SYNC_DIRECTORY, 'hibpSync_' + organizationId + '.json');
  const Vulnerabilities = await Vulnerability.createQueryBuilder('vuln')
  .select('vuln.structuredData', 'structuredData')
  .addSelect('dom.fromRootDomain', 'fromRootDomain')
  .addSelect('dom.name', 'name')
  .innerJoin('vuln.domain', 'dom')
  .where('dom.organizationId = :org_id', { org_id: organizationId })
  .andWhere('vuln.source = :source', { source: 'hibp'})
  .getRawMany();
  
  writeFileSync(INPUT_PATH, JSON.stringify(Vulnerabilities));
  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sync_hibp_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...process.env,
        org_name: organizationName,
        org_id: organizationId
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};