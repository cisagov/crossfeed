import { Domain, connectToDatabase, Vulnerability } from '../models';
import { spawnSync, execSync } from 'child_process';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import saveVulnerabilityToDb from './helpers/saveVulnerabilityToDb';
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

  const ps = spawnSync('nvdsync', ['-cve_feed', 'cve-1.1.json.gz', '.'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  // debug - ls
  const ls = spawnSync('ls', [], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  let input = '';
  for (const [index, host] of hostsToCheck.entries()) {
    input += `${index} ${host.cpes.join(',')}\n`;
    console.log(`${index} ${host.cpes.join(',')}`);
  }

  // Should change this to spawnSync
  const res = execSync(
    "cpe2cve -d ' ' -d2 , -o ' ' -o2 , -cpe 2 -e 2 -matches 3 -cve 2 -cvss 4 -cwe 5 nvdcve-1.1-2008.json.gz",
    { input: input }
  );

  const split = String(res).split('\n');
  for (const line of split) {
    const parts = line.split(' ');
    if (parts.length < 5) continue;
    const domain = hostsToCheck[parseInt(parts[0])].domain;

    const vulnerability = plainToClass(Vulnerability, {
      domain: domain,
      lastSeen: new Date(Date.now()),
      title: parts[1],
      cve: parts[1],
      cwe: parts[4],
      cpe: parts[2],
      cvss: parseFloat(parts[3]),
      state: 'open'
    });
    console.log(vulnerability);
    await saveVulnerabilityToDb(vulnerability);
  }
};
