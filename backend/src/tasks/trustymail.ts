import getAllDomains from './helpers/getAllDomains';
import { spawn, spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';

// TODO: Test using spawn in place of spawnSync
const orgMap = new Map<string, string>();
export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;
  orgMap[organizationId!] = new Map<string, string>();
  console.log('Running trustymail on organization', organizationName);

  const domains = await getAllDomains([organizationId!]);
  const domainNames = domains.map((domain) => domain.name);
  const domainCount = domainNames.length;
  console.log(`${organizationName} domains:`, domainNames);

  for (const domain of domains) {
    try {
      const args = [domain.name, '--json', '--debug', `--output=${domain.id}`];
      console.log('Running trustymail with args', args);
      spawnSync('trustymail', args, { stdio: 'pipe' });
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  console.log(
    `Trustymail scanned ${domainCount} domains for ${organizationName}`
  );
};
