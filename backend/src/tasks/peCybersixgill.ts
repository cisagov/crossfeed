import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { getPeEnv } from './helpers/getPeEnv';

// Call the sync_dnstwist_pe.py script that fetches dnstwist results, checks
// IPs using the blocklist.de api, then updates the PE db instance

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sixgill/run_cybersixgill.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...getPeEnv(),
        org_name: organizationName,
        org_id: organizationId
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
