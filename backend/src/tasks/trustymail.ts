import getAllDomains from './helpers/getAllDomains';
import { spawn, spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';
import saveTrustymailResultsToDb from './helpers/saveTrustymailResultsToDb';

// TODO: Push results to domain table
// TODO: Implement p-queue
// TODO: Add scan time to domain table
// TODO: Test using spawn in place of spawnSync once p-queue is implemented
export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  console.log('Running trustymail on organization', organizationName);

  const domains = await getAllDomains([organizationId!]);
  console.log(
    `${organizationName} domains to be scanned:`,
    domains.map((domain) => domain.name)
  );

  for (const domain of domains) {
    try {
      const args = [domain.name, '--json', '--debug', `--output=${domain.id}`];
      console.log('Running trustymail with args:', args);
      spawnSync('trustymail', args, { stdio: 'pipe' });
      saveTrustymailResultsToDb(domain.id, `${domain.id}.json`);
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  console.log(
    `Trustymail finished scanning ${domains.length} domains for ${organizationName}`
  );
};
