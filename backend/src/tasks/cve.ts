import { Domain, connectToDatabase, Vulnerability, Product } from '../models';
import { spawnSync, execSync } from 'child_process';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';

/**
 * The CVE scan finds vulnerable CVEs affecting domains based on CPEs identified
 */

const productMap = {
  'cpe:/a:microsoft:asp.net': ['cpe:/a:microsoft:.net_framework']
};

export const handler = async (commandOptions: CommandOptions) => {
  console.log('Running cve detection globally');

  await connectToDatabase();
  const allDomains = await Domain.find({
    select: ['id', 'name', 'ip'],
    relations: ['services']
  });
  const hostsToCheck: Array<{
    domain: Domain;
    cpes: string[];
  }> = [];
  for (const domain of allDomains) {
    const cpes = new Set<string>();

    for (const service of domain.services) {
      for (const product of service.products) {
        if (
          product.cpe &&
          product.version &&
          product.version.split('.').length > 1
        ) {
          cpes.add(product.cpe + ':' + product.version);
          if (productMap[product.cpe]) {
            for (const cpe of productMap[product.cpe]) {
              cpes.add(cpe + ':' + product.version);
            }
          }
        }
      }
    }
    if (cpes.size > 0)
      hostsToCheck.push({
        domain: domain,
        cpes: Array.from(cpes)
      });
  }

  spawnSync('nvdsync', ['-cve_feed', 'cve-1.1.json.gz', 'nvd-dump'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  let input = '';
  for (const [index, host] of hostsToCheck.entries()) {
    input += `${index} ${host.cpes.join(',')}\n`;
    console.log(`${index} ${host.cpes.join(',')}`);
  }

  // Should change this to spawnSync
  const res = execSync(
    "cpe2cve -d ' ' -d2 , -o ' ' -o2 , -cpe 2 -e 2 -matches 3 -cve 2 -cvss 4 -cwe 5 -require_version nvd-dump/nvdcve-1.1-2*.json.gz",
    { input: input, maxBuffer: buffer.constants.MAX_LENGTH }
  );

  const split = String(res).split('\n');
  const vulnerabilities: Vulnerability[] = [];
  for (const line of split) {
    const parts = line.split(' ');
    if (parts.length < 5) continue;
    const domain = hostsToCheck[parseInt(parts[0])].domain;

    const cvss = parseFloat(parts[3]);
    let severity: string;

    if (cvss === 0) severity = 'None';
    else if (cvss < 4) severity = 'Low';
    else if (cvss < 7) severity = 'Medium';
    else if (cvss < 9) severity = 'High';
    else severity = 'Critical';

    vulnerabilities.push(
      plainToClass(Vulnerability, {
        domain: domain,
        lastSeen: new Date(Date.now()),
        title: parts[1],
        cve: parts[1],
        cwe: parts[4],
        cpe: parts[2],
        cvss,
        severity,
        state: 'open'
      })
    );
  }
  await saveVulnerabilitiesToDb(vulnerabilities);
};
