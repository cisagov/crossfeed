import { Domain, Service } from '../models';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import * as path from "path";
import { readFileSync, writeFileSync } from 'fs';
import { Webpage } from '../models';
import { plainToClass } from 'class-transformer';
import saveWebpagesToDb from './helpers/saveWebpagesToDb';

const WEBSCRAPER_DIRECTORY = '/app/worker/webscraper';
const INPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'domains.txt');
const OUTPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'out.jl');
const S3_DATA_PATH = path.join(WEBSCRAPER_DIRECTORY, 's3-data');

// Sync this with backend/worker/webscraper/webscraper/items.py
interface ScraperItem {
  url: string;
  s3_key: string;
  status: number;
  domain_name: string;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running webscraper on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const urls = liveWebsites.map(domain => {
    const ports = domain.services.map((service) => service.port);
    let service: Service;
    if (ports.includes(443))
      service = domain.services.find((service) => service.port === 443)!;
    else service = domain.services.find((service) => service.port === 80)!;
    const url =
      service.port === 443 ? `https://${domain.name}` : `http://${domain.name}`;
    return url;
  });
  console.log('input urls', urls);
  if (urls.length === 0) {
    console.log("no urls, returning");
    return;
  }

  writeFileSync(INPUT_PATH, urls.join("\n"));
  
  let response: SpawnSyncReturns<any> = spawnSync(
    'scrapy',
    ['crawl', 'main', '-a', `domains_file=${INPUT_PATH}`],
    {
      cwd: WEBSCRAPER_DIRECTORY,
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      }
    }
  );
  if (response.error) {
    console.error(response.error);
  }
  if (response.stderr?.toString()) {
    console.error('stderr', response.stderr.toString());
  }
  if (response.status !== 0) {
    console.error('Failed', response.stdout?.toString(), response.stderr?.toString());
    return;
  }
  console.log(response.stdout?.toString());

  console.log("Going to sync to S3...");
  let args = ["s3", "cp", "--recursive", "--no-progress", S3_DATA_PATH, `s3://${process.env.WEBSCRAPER_S3_BUCKET_NAME}`];
  if (process.env.IS_LOCAL && typeof jest === 'undefined') {
    // Use the minio s3 endpoint for local development.
    args = ['--endpoint-url', 'http://minio:9000', ...args];
  }
  console.log('aws', args);
  response = spawnSync(
    'aws',
    args,
    {env: process.env},
  );
  if (response.error) {
    console.error(response.error);
  }
  if (response.stderr?.toString()) {
    console.error('stderr', response.stderr.toString());
  }
  if (response.status !== 0) {
    console.error('Failed', response.stdout?.toString(), response.stderr?.toString());
    return;
  }
  console.log(response.stdout?.toString());

  console.log("Going to save webpages to the database...");
  const liveWebsitesMap: {[x: string]: Domain} = {};
  for (let domain of liveWebsites) {
    liveWebsitesMap[domain.name] = domain;
  }
  const output = String(readFileSync(OUTPUT_PATH));
  const lines = output.split('\n').filter(e => e.trim());
  const webpages: Webpage[] = [];
  for (let line of lines) {
    const item: ScraperItem = JSON.parse(line);
    const domain = liveWebsitesMap[item.domain_name];
    if (!domain) {
      console.error(`No corresponding domain found for item with domain_name ${item.domain_name}.`);
      continue;
    }
    webpages.push(
      plainToClass(Webpage, {
        domain: { id: domain.id },
        discoveredBy: { id: scanId },
        lastSeen: new Date(Date.now()),
        s3Key: item.s3_key,
        url: item.url,
        status: item.status,
      })
    );
  }
  await saveWebpagesToDb(webpages);

  console.log(`Webscraper finished for ${liveWebsites.length} domains, found ${webpages.length} webpages`);
};
