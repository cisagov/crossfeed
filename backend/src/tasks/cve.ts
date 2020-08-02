import { Domain, connectToDatabase } from '../models';
import { spawn, spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as path from 'path';

const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.txt');

/**
 * The CVE scan finds vulnerable CVEs affecting domains based on CPEs identified
 */

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running cve detection globally');

  await connectToDatabase();
  const allDomains = await Domain.find({
    select: ['id', 'name', 'ip', 'webTechnologies'],
    relations: ['services']
  });
  const hostsToCheck: Array<{
    domain: Domain;
    cpes: string[];
  }> = [];
  for (const domain of allDomains) {
    const cpes = new Set<string>();
    for (const tech of domain.webTechnologies) {
      if (tech.cpe && tech.version) cpes.add(tech.cpe + ':' + tech.version);
    }

    for (const service of domain.services) {
      if (
        service.censysMetadata &&
        service.censysMetadata.manufacturer &&
        service.censysMetadata.product &&
        service.censysMetadata.version
      ) {
        // TODO: Improve methods for getting CPEs from Censys
        // See https://www.napier.ac.uk/~/media/worktribe/output-1500093/identifying-vulnerabilities-using-internet-wide-scanning-data.pdf
        // and https://github.com/TheHairyJ/Scout
        cpes.add(
          `cpe:/a:${service.censysMetadata.manufacturer}:${service.censysMetadata.product}:${service.censysMetadata.version}`.toLowerCase()
        );
      }
    }
    if (cpes.size > 0)
      hostsToCheck.push({
        domain: domain,
        cpes: Array.from(cpes)
      });
  }

  spawnSync('nvdsync', ['-cve_feed', 'cve-1.1.json.gz', '.']);

  const child = spawn(
    'cpe2cve',
    [
      '-d',
      '" "',
      '-d2',
      ',',
      '-o',
      '" "',
      '-o2',
      ',',
      '-cpe',
      '2',
      '-e',
      '2',
      '-matches',
      '3',
      '-cve',
      '2',
      '-require_version',
      'nvdcve-1.1-*.json.gz'
    ],
    { stdio: 'pipe' }
  );

  console.log(hostsToCheck);
  for (const [index, host] of hostsToCheck.entries()) {
    child.stdin.write(`${index} ${host.cpes.join(',')}`);
  }

  child.stdin.end();

  for await (const data of child.stdout) {
    console.log(`stdout from the child: ${data}`);
  }
};
