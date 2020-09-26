import { Service } from '../models';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import { execSync, spawnSync, SpawnSyncReturns } from 'child_process';
import * as path from "path";
import { readdirSync } from 'fs';
import { readFileSync } from 'fs';

const WEBSCRAPER_DIRECTORY = '/app/worker/webscraper';
const INPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'domains.txt');
const OUTPUT_PATH = path.join(WEBSCRAPER_DIRECTORY, 'out.jl');
const S3_DATA_PATH = path.join(WEBSCRAPER_DIRECTORY, 's3-data');

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

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
  path.join(__dirname, "domains.txt",)
  console.log('input urls', urls);
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
  console.error(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY);
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
  const output = readFileSync(OUTPUT_PATH);
  console.log(output);

  console.log(`webscraper finished for ${liveWebsites.length} domains`);
};
