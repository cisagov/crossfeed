import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';

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
        ...process.env,
        PE_DB_USERNAME: process.env.PE_DB_USERNAME,
        PE_DB_PASSWORD: process.env.PE_DB_PASSWORD,
        PE_DB_NAME: process.env.PE_DB_NAME,
        SIXGILL_CLIENT_ID: process.env.SIXGILL_CLIENT_ID,
        SIXGILL_CLIENT_SECRET: process.env.SIXGILL_CLIENT_SECRET,
        org_name: organizationName,
        org_id: organizationId
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
