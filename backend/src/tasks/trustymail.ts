import getAllDomains from './helpers/getAllDomains';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { CommandOptions } from './ecs-client';
import saveTrustymailResultsToDb from './helpers/saveTrustymailResultsToDb';
import * as chokidar from 'chokidar';

// TODO: Add scan time to domain table
// TODO: Retry failed domains
// TODO: PSL is downloaded once per organization per scan; would like to download only once per day
export const handler = async (commandOptions: CommandOptions) => {
  let pslDownloaded = false;
  const { organizationId, organizationName } = commandOptions;
  console.log('Running Trustymail on organization', organizationName);
  const domains = await getAllDomains([organizationId!]);
  const queue = new Set(domains.map((domain) => `${domain.id}.json`));
  const failedDomains = new Set<string>();
  // Event listener detects when public_suffix_list.dat is downloaded
  chokidar.watch('public_suffix_list.dat').on('add', () => {
    console.log('Public suffix list downloaded');
    pslDownloaded = true;
  });
  console.log(
    `${organizationName} domains to be scanned:`,
    domains.map((domain) => domain.name)
  );
  console.log(`queue`, queue);
  for (const domain of domains) {
    const path = `${domain.id}.json`;
    // Event listener detects Trustymail results file at creation and syncs it to db
    chokidar.watch(path).on('add', (path) => {
      console.log('Trustymail saved results to', path);
      console.log(`Syncing ${path} to db...`);
      saveTrustymailResultsToDb(path).then(() => {
        console.log(`Deleting ${path} and removing it from queue...`);
        queue.delete(path);
        console.log(`Items left in queue:`, queue);
      });
    });
    try {
      const args = [
        domain.name,
        '--json',
        `--output=${domain.id}`,
        '--psl-file=public_suffix_list.dat'
      ];
      console.log('Running Trustymail with args:', args);
      const child = spawn('trustymail', args, { stdio: 'pipe' });
      addEventListenersToChildProcess(
        child,
        domain,
        queue,
        path,
        failedDomains
      );
      // Wait for PSL download and continue to next domain if it takes more than 10 seconds
      let pslDownloadTimeout = 0;
      while (!pslDownloaded && pslDownloadTimeout < 10) {
        console.log('Waiting for public_suffix_list.dat to be generated...');
        await delay(1000 * 1);
        pslDownloadTimeout++;
      }
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  // Keep container alive while syncing results to db; timeout after 10 minutes (60 * 10 seconds)
  let dbSyncTimeout = 0;
  while (queue.size > 0 && dbSyncTimeout < 60) {
    console.log('Waiting for Trustymail results to sync to db...');
    console.log('queue', queue);
    await delay(1000 * 10);
    dbSyncTimeout++;
  }
  console.log(
    `Trustymail successfully scanned ${
      domains.length - failedDomains.size
    } domains out of ${domains.length} domains \n failed domains:`,
    failedDomains
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addEventListenersToChildProcess(
  child: ChildProcessWithoutNullStreams,
  domain: { name: string; id: string },
  queue: Set<string>,
  path: string,
  failedDomains: Set<string>
) {
  child.stdout.on('data', (data) => {
    console.log(`${domain.name} (${domain.id}) stdout: ${data}`);
  });
  child.on('spawn', () => {
    console.log(
      `Spawned ${domain.name} (${domain.id}) Trustymail child process`
    );
  });
  child.on('error', (err) =>
    console.error(
      `Error with Trustymail ${domain.name} (${domain.id}) child process:`,
      err
    )
  );
  child.on('exit', (code, signal) => {
    console.log(
      `Trustymail child process ${domain.name} (${domain.id}) exited with code`,
      code,
      'and signal',
      signal
    );
    if (code !== 0) {
      queue.delete(path);
      failedDomains.add(domain.id);
    }
  });
}
