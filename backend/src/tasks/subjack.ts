import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import { spawnSync } from 'child_process';
import getAllDomains from './helpers/getAllDomains';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { Domain, Vulnerability } from '../models';
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
  domains[0].name = 'enmxxtjnqrnl.x.pipedream.net';
  const domainsMap: { [domain: string]: Domain } = {};
  for (const domain of domains) domainsMap[domain.name] = domain;

  mkdirSync('/app/worker/subjack', { recursive: true });
  writeFileSync(INPUT_PATH, domains.map((domain) => domain.name).join('\n'));
  const { stdout, stderr, status } = spawnSync(
    'subjack',
    [
      '-c',
      'subjack/fingerprints.json',
      '-w',
      INPUT_PATH,
      '-t',
      '10',
      '-o',
      OUTPUT_PATH
    ],
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

  // A file is only written if any vulnerable subdomains were found
  if (existsSync(OUTPUT_PATH)) {
    const output = String(readFileSync(OUTPUT_PATH));
    const results: SubjackResult[] = JSON.parse(output);
    for (const result of results) {
      if (result.vulnerable) {
        vulnerabilities.push(
          plainToClass(Vulnerability, {
            domain: domainsMap[result.subdomain],
            lastSeen: new Date(Date.now()),
            title: `Subdomain takeover - ${result.service}`,
            severity: 'High',
            state: 'open',
            source: 'subjack',
            description: `This subdomain appears to be vulnerable to subdomain takeover via ${result.service}. An attacker may be able to register the nonexistent site on ${result.service}, leading to defacement.`,
            references: [
              {
                url:
                  'https://developer.mozilla.org/en-US/docs/Web/Security/Subdomain_takeovers',
                name: 'Subdomain takeovers - Mozilla',
                source: '',
                tags: []
              }
            ]
          })
        );
      }
    }

    await saveVulnerabilitiesToDb(vulnerabilities, false);
  }

  console.log(
    `Subjack finished, discovered ${vulnerabilities.length} vulnerabilities`
  );
};
