import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import { Vulnerability } from 'src/models';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { getLiveWebsites } from './helpers/getLiveWebsites';

const INPUT_PATH = '/app/worker/gowitness/input.txt';
const OUTPUT_PATH = '/app/worker/gowitness/output';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running gowitness on organization', organizationName);

  const websites = await getLiveWebsites(organizationId!);

  if (websites.length === 0) {
    console.log('no websites, returning');
    return;
  }

  mkdirSync('/app/worker/gowitness');
  mkdirSync(OUTPUT_PATH);

  writeFileSync(INPUT_PATH, websites.map((website) => website.url).join('\n'));

  const { stdout, stderr, status } = spawnSync(
    'gowitness',
    ['file', '-f', INPUT_PATH, '-t', '16', '-P', OUTPUT_PATH],
    {
      env: {
        ...process.env,
        HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY,
        HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY
      },
      maxBuffer: buffer.constants.MAX_LENGTH
    }
  );
  if (stderr.toString()) {
    console.error('stderr', stderr.toString());
  }
  if (status !== 0) {
    console.error('Gowitness failed');
    return;
  }

  const out = readdirSync(OUTPUT_PATH);
  console.log(JSON.stringify(out));

  // Upload files to S3

  // Update DB with links to S3

  console.log(`Gowitness finished, discovered ${out.length} screenshots`);
};
