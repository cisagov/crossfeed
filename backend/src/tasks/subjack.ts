import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import { spawnSync } from 'child_process';
import getAllDomains from './helpers/getAllDomains';
import { writeFileSync } from 'fs';
import { domain } from 'process';
import { Vulnerability } from 'src/models';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';

const INPUT_PATH = '/app/worker/subjack/input.txt';
const OUTPUT_PATH = '/app/worker/subjack/output.json';

interface SubjackResult {
  subdomain: string;
  vulnerable: boolean;
  service?: string;
  domain?: string;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running subjack on organization', organizationName);

  const domains = await getAllDomains([organizationId!]);

  if (domains.length === 0) {
    console.log('no domains, returning');
    return;
  }

  writeFileSync(INPUT_PATH, domains.map((domain) => domain.name).join('\n'));

  const { stdout, stderr, status } = spawnSync(
    'subjack',
    ['-w', INPUT_PATH, '-t', '10', '-o', OUTPUT_PATH],
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
    console.error('Subjack failed');
    return;
  }

  const vulnerabilities: Vulnerability[] = [];

  const output = stdout.toString();
  const results: SubjackResult[] = JSON.parse(output);
  for (const index in results) {
    const result = results[index];
    if (result.vulnerable) {
      vulnerabilities.push(
        plainToClass(Vulnerability, {
          domain: domains[index],
          lastSeen: new Date(Date.now()),
          title: `Subdomain takeover`,
          severity: 'High',
          state: 'open',
          source: 'subjack',
          description: ``
        })
      );
    }
  }

  await saveVulnerabilitiesToDb(vulnerabilities, false);

  console.log(
    `Subjack finished, discovered ${vulnerabilities.length} vulnerabilities`
  );
};
