import getAllDomains from './helpers/getAllDomains';
import { spawn, spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';
import saveTrustymailResultsToDb from './helpers/saveTrustymailResultsToDb';
import * as chokidar from 'chokidar';
import * as fs from 'fs';

// TODO: output list of domains that failed to scan
// TODO: Add scan time to domain table
// TODO: Add timeout to exit while loop
export const handler = async (commandOptions: CommandOptions) => {
  // Initialize watcher to detect changes to files in /app folder
  const watcher = chokidar.watch('.', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    depth: 0,
    persistent: true
  });
  const queue = new Set<string>();
  const failedDomains = new Map<string, string[]>();
  // Add event listener for when a file is added to the /app folder
  watcher.on('add', (path) => {
    console.log('File', path, 'has been added');
    if (queue.has(path)) {
      console.log('queue has path', path);
      syncToDB(path);
      console.log('deleting path from queue', path);
      console.log('queue before delete', queue);
      queue.delete(path);
      console.log('queue after delete', queue);
    }
  });
  const { organizationId, organizationName } = commandOptions;
  console.log('Running trustymail on organization', organizationName);
  const domains = await getAllDomains([organizationId!]);
  console.log(
    `${organizationName} domains to be scanned:`,
    domains.map((domain) => domain.name)
  );
  console.log(`queue`, queue);
  for (const domain of domains) {
    try {
      const path = `${domain.id}.json`;
      queue.add(path);
      const args = [
        domain.name,
        '--json',
        `--output=${domain.id}`,
        '--psl-file=/app/worker/public_suffix_list.dat',
        '--psl-read-only'
      ];
      console.log('Running trustymail with args:', args);
      const child = spawn('trustymail', args, { stdio: 'pipe' });
      await delay(1000 * 20);
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
        if (code !== 0) {
          queue.delete(path);
          failedDomains.set(domain.id, [
            domain.name,
            organizationName!,
            organizationId!
          ]);
        }
      });
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
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  while (queue.size > 0) {
    console.log('Waiting for trustymail results to sync to db...');
    console.log('queue', queue);
    await delay(1000 * 60 * 1);
  }
  console.log(
    `trustymail failed for ${failedDomains.size} domains out of ${domains.length} domains \n failed domains:`,
    failedDomains
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function syncToDB(path: string) {
  const domainId = path.split('.')[0];
  console.log(`Syncing results to db for ${path} to domainId ${domainId}...`);
  const jsonData = await fs.promises.readFile(path);
  await saveTrustymailResultsToDb(domainId, jsonData)
    .then(() =>
      fs.unlink(path, (err) => {
        if (err) throw err;
      })
    )
    .then(() => console.log(`Saved result for ${domainId} to database.`));
}
