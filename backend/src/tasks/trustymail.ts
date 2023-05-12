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
      const args = [
        domain.name,
        // '--timeout=2',
        // '--smtp-timeout=2',
        '--json',
        `--output=${domain.id}`
      ];
      console.log('Running trustymail with args:', args);
      const child = spawn('trustymail', args, { stdio: 'pipe' });
      child.stdout.on('data', (data) => {
        console.log(`${domain.name} (${domain.id}) stdout: ${data}`);
      });
      child.on('spawn', () => {
        console.log(
          `Spawned ${domain.name} (${domain.id}) trustymail child process`
        );
      });
      child.on('error', (err) =>
        console.error(
          `Error with trustymail ${domain.name} (${domain.id}) child process:`,
          err
        )
      );
      child.on('exit', (code, signal) => {
        console.log(
          `trustymail child process ${domain.name} (${domain.id}) exited with code`,
          code,
          'and signal',
          signal
        );
        setTimeout(() => {
          console.log(
            `Syncing results to db for ${domain.name} (${domain.id})...`
          );
          const path = `${domain.id}.json`;
          const jsonData = fs.readFileSync(path);
          saveTrustymailResultsToDb(domain.id, jsonData)
            // .then(() =>
            //   fs.unlink(path, (err) => {
            //     if (err) throw err;
            //   })
            // )
            .then(() =>
              console.log(`Saved result for ${domain.name} to database.`)
            );
        }, 1000 * 60 * 2);
      });
      child.on('close', (code, signal) =>
        console.log(
          `trustymail ${domain.name} (${domain.id}) child process closed with code`,
          code,
          'and signal',
          signal
        )
      );
      child.on('disconnect', () =>
        console.log(
          `trustymail ${domain.name} (${domain.id}) child process disconnected`
        )
      );
      child.on('message', (message, sendHandle) =>
        console.log(
          `trustymail ${domain.name} (${domain.id}) child process message:`,
          message,
          sendHandle
        )
      );
      await delay(1000 * 60 * 2);
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  await delay(1000 * 60 * domains.length);
  console.log(
    `Trustymail finished scanning ${domains.length} domains for ${organizationName}.`
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
