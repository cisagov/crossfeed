import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';

// Sync Crossfeed's hibp data with PE's db instance

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
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
