import getAllDomains from './helpers/getAllDomains';
import { spawn, spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';
import saveTrustymailResultsToDb from './helpers/saveTrustymailResultsToDb';
import * as fs from 'fs';

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
      const args = [domain.name, '--json', `--output=${domain.id}`];
      console.log('Running trustymail with args:', args);
      spawnSync('trustymail', args, { stdio: 'pipe' });
      const path = `${domain.id}.json`;
      const jsonData = await fs.promises.readFile(path).then((data) => data);
      await saveTrustymailResultsToDb(domain.id, jsonData)
        .then(() =>
          fs.unlink(path, (err) => {
            if (err) throw err;
          })
        )
        .then(() =>
          console.log(`Saved result for ${domain.name} to database.`)
        );
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  console.log(
    `Trustymail finished scanning ${domains.length} domains for ${organizationName}.`
  );
};
