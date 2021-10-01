import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  // use spawn sync to call app/worker/pe_scripts/sync_dnstwist_pe.py
  // and app/worker/pe_scripts/sync_hibp_pe.py
  // will pass the Crossfeed and PE db env variables to connect from the python end
  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/sync_dnstwist_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...process.env,
        PE_USERNAME: process.env.PE_DB_USERNAME
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};
