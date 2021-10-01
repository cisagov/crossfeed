import { CommandOptions } from './ecs-client';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  // use spawn sync to call app/worker/pe_scripts/sync_dnstwist_pe.py
  // and app/worker/pe_scripts/sync_hibp_pe.py
  // will pass the Crossfeed and PE db env variables to connect from the python end
};
