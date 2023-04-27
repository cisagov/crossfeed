import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { getPeEnv } from './helpers/getPeEnv';

// Call the sync_dnstwist_pe.py script that fetches dnstwist results, checks

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  const child = spawnSync(
    'python3',
    ['/app/worker/scripts/trustymail/run_trustymail.py'],
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
