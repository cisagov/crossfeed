import {
  connectToDatabase,
  Domain,
  Organization,
  Scan,
  Service
} from '../models';
import { CommandOptions } from './ecs-client';
import { getLiveWebsites } from './helpers/getLiveWebsites';
import { spawn } from 'child_process';
import * as path from 'path';
import { writeFileSync } from 'fs';
import saveWebpagesToDb from './helpers/saveWebpagesToDb';
import * as readline from 'readline';
import PQueue from 'p-queue';
import { chunk } from 'lodash';
import { In } from 'typeorm';
import getScanOrganizations from './helpers/getScanOrganizations';

const WEBSCRAPER_DIRECTORY = '/app/worker/webscraper';
const INPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'domains.txt');
const WEBPAGE_DB_BATCH_LENGTH = process.env.IS_LOCAL ? 2 : 10;

// Sync this with backend/worker/webscraper/webscraper/items.py
export interface ScraperItem {
  url: string;
  status: number;
  domain_name: string;
  response_size: number;

  body: string;
  headers: { name: string; value: string }[];

  domain?: { id: string };
  discoveredBy?: { id: string };
}

export const handler = async (commandOptions: CommandOptions) => {
  const { chunkNumber, numChunks, organizationId, scanId } = commandOptions;

  await connectToDatabase();

  const scan = await Scan.findOne(
    { id: scanId },
    { relations: ['organizations', 'tags', 'tags.organizations'] }
  );

  let orgs: string[] | undefined = undefined;
  // webscraper is a global scan, so organizationId is only specified for tests.
  // Otherwise, scan.organizations can be used for granular control of webscraper.
  if (organizationId) orgs = [organizationId];
  else if (scan?.isGranular) {
    orgs = getScanOrganizations(scan).map((org) => org.id);
  }

  const where = orgs?.length ? { id: In(orgs) } : {};
  const organizations = await Organization.find({ where, select: ['id'] });
  const organizationIds = (
    chunk(organizations, numChunks)[chunkNumber!] || []
  ).map((e) => e.id);
  console.log('Running webscraper on organizations ', organizationIds);

  const liveWebsites = await getLiveWebsites(undefined, organizationIds);
  const urls = liveWebsites.map((domain) => domain.url);
  console.log('input urls', urls);
  if (urls.length === 0) {
    console.log('no urls, returning');
    return;
  }

  writeFileSync(INPUT_PATH, urls.join('\n'));

  const liveWebsitesMap: { [x: string]: Domain } = {};
  for (const domain of liveWebsites) {
    liveWebsitesMap[domain.name] = domain;
  }
  let totalNumWebpages = 0;
  const queue = new PQueue({ concurrency: 1 });

  const scrapyProcess = spawn(
    'scrapy',
    ['crawl', 'main', '-a', `domains_file=${INPUT_PATH}`],
    {
      cwd: WEBSCRAPER_DIRECTORY,
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      },
      stdio: 'pipe'
    }
  );

  const readInterface = readline.createInterface({
    // Database output
    input: scrapyProcess.stdout
  });
  const readInterfaceStderr = readline.createInterface({
    // Scrapy logs
    input: scrapyProcess.stderr
  });

  await new Promise((resolve, reject) => {
    console.log('Going to save webpages to the database...');
    let scrapedWebpages: ScraperItem[] = [];
    readInterfaceStderr.on('line', (line) =>
      console.error(line?.substring(0, 999))
    );
    readInterface.on('line', async (line) => {
      if (!line?.trim() || line.indexOf('database_output: ') === -1) {
        console.log(line);
        return;
      }
      const item: ScraperItem = JSON.parse(
        line.slice(
          line.indexOf('database_output: ') + 'database_output: '.length
        )
      );
      const domain = liveWebsitesMap[item.domain_name];
      if (!domain) {
        console.error(
          `No corresponding domain found for item with domain_name ${item.domain_name}.`
        );
        return;
      }
      scrapedWebpages.push({
        ...item,
        domain: { id: domain.id },
        discoveredBy: { id: scanId }
      });
      if (scrapedWebpages.length >= WEBPAGE_DB_BATCH_LENGTH) {
        await queue.onIdle();
        queue.add(async () => {
          if (scrapedWebpages.length === 0) {
            return;
          }
          console.log(
            `Saving ${scrapedWebpages.length} webpages, starting with ${scrapedWebpages[0].url}...`
          );
          await saveWebpagesToDb(scrapedWebpages);
          totalNumWebpages += scrapedWebpages.length;
          scrapedWebpages = [];
        });
      }
    });

    readInterface.on('close', async () => {
      await queue.onIdle();
      if (scrapedWebpages.length > 0) {
        console.log(
          `Saving ${scrapedWebpages.length} webpages to the database...`
        );
        await saveWebpagesToDb(scrapedWebpages);
        totalNumWebpages += scrapedWebpages.length;
        scrapedWebpages = [];
      }
      resolve(undefined);
    });
    readInterface.on('SIGINT', reject);
    readInterface.on('SIGCONT', reject);
    readInterface.on('SIGTSTP', reject);
  });
  console.log(
    `Webscraper finished for ${liveWebsites.length} domains, saved ${totalNumWebpages} webpages in total`
  );
};
