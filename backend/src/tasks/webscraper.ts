import { Domain, Service } from '../models';
import { CommandOptions } from './ecs-client';
import { getLiveWebsites } from './helpers/getLiveWebsites';
import { spawn } from 'child_process';
import * as path from 'path';
import { writeFileSync } from 'fs';
import { Webpage } from '../models';
import { plainToClass } from 'class-transformer';
import saveWebpagesToDb from './helpers/saveWebpagesToDb';
import * as readline from 'readline';
import PQueue from 'p-queue';

const WEBSCRAPER_DIRECTORY = '/app/worker/webscraper';
const INPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'domains.txt');
const WEBPAGE_DB_BATCH_LENGTH = 100;

// Sync this with backend/worker/webscraper/webscraper/items.py
interface ScraperItem {
  url: string;
  s3_key: string;
  status: number;
  domain_name: string;
  response_size: number;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running webscraper on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
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
    let webpages: Webpage[] = [];
    readInterfaceStderr.on('line', (line) => console.error(line));
    readInterface.on('line', async (line) => {
      if (!line?.trim() || line.indexOf('database_output: ') === -1) {
        console.log(line);
        return;
      }
      console.log('got line', line);
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
      webpages.push(
        plainToClass(Webpage, {
          domain: { id: domain.id },
          discoveredBy: { id: scanId },
          lastSeen: new Date(Date.now()),
          s3Key: item.s3_key,
          url: item.url,
          status: item.status,
          responseSize: item.response_size
        })
      );
      if (webpages.length >= WEBPAGE_DB_BATCH_LENGTH) {
        await queue.onIdle();
        queue.add(async () => {
          if (webpages.length === 0) {
            return;
          }
          console.log(`Saving ${webpages.length} webpages to the database...`);
          await saveWebpagesToDb(webpages);
          totalNumWebpages += webpages.length;
          webpages = [];
        });
      }
    });

    readInterface.on('close', async () => {
      await queue.onIdle();
      if (webpages.length > 0) {
        console.log(`Saving ${webpages.length} webpages to the database...`);
        await saveWebpagesToDb(webpages);
        totalNumWebpages += webpages.length;
        webpages = [];
      }
      resolve();
    });
    readInterface.on('SIGINT', reject);
    readInterface.on('SIGCONT', reject);
    readInterface.on('SIGTSTP', reject);
  });
  console.log(
    `Webscraper finished for ${liveWebsites.length} domains, saved ${totalNumWebpages} webpages in total`
  );
};
