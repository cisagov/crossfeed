import getAllDomains from './helpers/getAllDomains';
import { spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';
import * as path from 'path';

const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.txt');

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running trustymail on organization', organizationName);

  const domains = await getAllDomains([organizationId!]);
  console.log(`${organizationName} domains`, domains);

  for (const domain of domains) {
    try {
      const args = [domain.name, '-o', OUT_PATH];
      console.log('Running trustymail with args', args);
      spawnSync('trustymail', args, { stdio: 'pipe' });
      console.log(
        `Findomain scanned ${domains.length} domains for ${organizationName}`
      );
    } catch (e) {
      console.error(e);
      continue;
    }
  }
};
