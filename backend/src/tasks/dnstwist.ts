import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { getPeEnv } from './helpers/getPeEnv';

export const handler = async (commandOptions: CommandOptions) => {
  console.log('Running dnstwist on P&E organizations');

  const child = spawnSync('python', ['-m', 'pe_source', 'dnstwist'], {
    stdio: 'inherit',
    encoding: 'utf-8',
    env: {
      ...getPeEnv()
    },
    cwd: '/app/pe-reports'
  });
  console.log('Done');
};
