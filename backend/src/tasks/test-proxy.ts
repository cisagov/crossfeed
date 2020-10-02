import axios from 'axios';
import { CommandOptions } from './ecs-client';
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

const WEBHOOK_URL_HTTP =
  'http://webhook.site/84feeee1-2966-42ee-9bd6-80a9b742d78d';
const WEBHOOK_URL_HTTPS =
  'https://webhook.site/84feeee1-2966-42ee-9bd6-80a9b742d78d';
const WEBHOOK_ADMIN_URL =
  'https://webhook.site/#!/84feeee1-2966-42ee-9bd6-80a9b742d78d/f9093e12-1897-462a-a18d-ad91b6131ec6';

const WEBSCRAPER_DIRECTORY = '/app/worker/webscraper';

/**
 * Integration test to make sure that the proxies work properly.
 * This test should be run manually whenever dependencies are upgraded, etc.
 *
 * Results should be checked at WEBHOOK_ADMIN_URL. All the requests made below
 * should display at the admin URL, and they should all be signed and have a
 * Crossfeed test user agent.
 *
 * To run the test, run:
 * docker-compose up --build
 * cd backend && docker run -e WORKER_TEST=true --network="crossfeed_backend" -t crossfeed-worker
 *
 * In the future, we can point these URLs to a locally running web server
 * in order to make this test be able to be automatically run.
 */
export const handler = async (commandOptions: CommandOptions) => {
  await axios.get(WEBHOOK_URL_HTTP + '?source=axios');
  await axios.get(WEBHOOK_URL_HTTPS + '?source=axios');

  spawnSync(
    'intrigue-ident',
    ['--uri', WEBHOOK_URL_HTTP + '?source=intrigue-ident', '--json'],
    {
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      }
    }
  );

  spawnSync(
    'intrigue-ident',
    ['--uri', WEBHOOK_URL_HTTPS + '?source=intrigue-ident', '--json'],
    {
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      }
    }
  );

  writeFileSync('/test-domains-http.txt', WEBHOOK_URL_HTTP + '?source=scrapy');

  spawnSync(
    'scrapy',
    ['crawl', 'main', '-a', `domains_file=/test-domains-http.txt`],
    {
      cwd: WEBSCRAPER_DIRECTORY,
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      }
    }
  );

  writeFileSync(
    '/test-domains-https.txt',
    WEBHOOK_URL_HTTPS + '?source=scrapy'
  );

  spawnSync(
    'scrapy',
    ['crawl', 'main', '-a', `domains_file=/test-domains-https.txt`],
    {
      cwd: WEBSCRAPER_DIRECTORY,
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      }
    }
  );
};
