import { CommandOptions } from './ecs-client';
import { spawnSync} from 'child_process';
import { ProcessCredentials } from 'aws-sdk';

export const handler = async (commandOptions: CommandOptions) => {
    const { organizationId, organizationName } = commandOptions;
    
    const child = spawnSync(
        'python3',
        ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
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