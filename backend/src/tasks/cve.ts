import {
  Domain,
  connectToDatabase,
  Vulnerability,
  Service,
  Webpage
} from '../models';
import { spawnSync, execSync } from 'child_process';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { LessThan, MoreThan, FindOperator, In, MoreThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import * as zlib from 'zlib';

/**
 * The CVE scan creates vulnerabilities based on existing
 * data (such as product version numbers / CPEs, webpages)
 * that have already been collected from other scans.
 */

const productMap = {
  'cpe:/a:microsoft:asp.net': ['cpe:/a:microsoft:.net_framework']
};

// The number of domains to process at once
const BATCH_SIZE = 1000;

/**
 * Scan for new vulnerabilities based on version numbers of identified CPEs
 */
const identifyPassiveCVEsFromCPEs = async (allDomains: Domain[]) => {
  const hostsToCheck: Array<{
    domain: Domain;
    service: Service;
    cpes: string[];
  }> = [];

  for (const domain of allDomains) {
    for (const service of domain.services) {
      const cpes = new Set<string>();
      for (const product of service.products) {
        if (
          product.cpe &&
          product.version &&
          String(product.version).split('.').length > 1
        ) {
          cpes.add(product.cpe + ':' + product.version);
          if (productMap[product.cpe]) {
            for (const cpe of productMap[product.cpe]) {
              cpes.add(cpe + ':' + product.version);
            }
          }
        }
      }
      if (cpes.size > 0)
        hostsToCheck.push({
          domain: domain,
          service: service,
          cpes: Array.from(cpes)
        });
    }
  }
  if (hostsToCheck.length === 0) {
    console.warn('No hosts to check - no domains with CPEs found.');
    return;
  }

  spawnSync('nvdsync', ['-cve_feed', 'cve-1.1.json.gz', 'nvd-dump'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  const numBatches = hostsToCheck.length / BATCH_SIZE;
  for (let batch = 0; batch < numBatches; batch++) {
    let input = '';
    for (
      let index = BATCH_SIZE * batch;
      index < Math.min(BATCH_SIZE * (batch + 1), hostsToCheck.length);
      index++
    ) {
      input += `${index} ${hostsToCheck[index].cpes.join(',')}\n`;
      console.log(`${index} ${hostsToCheck[index].cpes.join(',')}`);
    }
    let res: Buffer;
    try {
      res = execSync(
        "cpe2cve -d ' ' -d2 , -o ' ' -o2 , -cpe 2 -e 2 -matches 3 -cve 2 -cvss 4 -cwe 5 -require_version nvd-dump/nvdcve-1.1-2*.json.gz",
        { input: input, maxBuffer: buffer.constants.MAX_LENGTH }
      );
    } catch (e) {
      console.error(e);
      continue;
    }
    const split = String(res).split('\n');
    const vulnerabilities: Vulnerability[] = [];
    for (const line of split) {
      const parts = line.split(' ');
      if (parts.length < 5) continue;
      const domain = hostsToCheck[parseInt(parts[0])].domain;

      const service = hostsToCheck[parseInt(parts[0])].service;

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
          state: 'open',
          source: 'cpe2cve',
          needsPopulation: true,
          service: service
        })
      );
    }
    await saveVulnerabilitiesToDb(vulnerabilities, false);
  }
};

/**
 * Identifies unexpected webpages.
 */
const identifyUnexpectedWebpages = async (allDomains: Domain[]) => {
  const vulnerabilities: Vulnerability[] = [];
  const webpages = await Webpage.find({
    where: {
      domain: { id: In(allDomains.map((e) => e.id)) },
      status: MoreThanOrEqual(500)
    },
    relations: ['domain']
  });
  for (const webpage of webpages) {
    vulnerabilities.push(
      plainToClass(Vulnerability, {
        domain: webpage.domain,
        lastSeen: new Date(Date.now()),
        title: `Unexpected status code ${webpage.status} for ${webpage.url}`,
        severity: 'Low',
        state: 'open',
        source: 'webpage_status_code',
        description: `${webpage.status} is not a normal status code that comes from performing a GET request on ${webpage.url}. This may indicate a misconfiguration or a potential for a Denial of Service (DoS) attack.`
      })
    );
  }
  await saveVulnerabilitiesToDb(vulnerabilities, false);
};

/**
 * Identifies expired and soon-to-expire certificates.
 */
const identifyExpiringCerts = async (allDomains: Domain[]) => {
  const oneWeekFromNow = new Date(
    new Date(Date.now()).setDate(new Date(Date.now()).getDate() + 7)
  );
  const vulnerabilities: Vulnerability[] = [];
  for (const domain of allDomains) {
    const { validTo } = domain.ssl || {};
    if (validTo && new Date(validTo) <= oneWeekFromNow) {
      vulnerabilities.push(
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          title: `Expiring SSL certificate`,
          severity: 'Critical',
          state: 'open',
          source: 'certs',
          description: `This domain's SSL certificate is expiring / has expired at ${new Date(
            validTo
          ).toISOString()}. Please make sure its certificate is renewed, or users may face SSL errors when trying to navigate to the site.`
        })
      );
    }
  }
  await saveVulnerabilitiesToDb(vulnerabilities, false);
};

interface NvdFile {
  CVE_Items: {
    cve: {
      CVE_data_meta: {
        ID: string;
      };
      references: {
        reference_data: {
          url: string;
          name: string;
          refsource: string;
          tags: string[];
        }[];
      };
      description: {
        description_data: {
          lang: string;
          value: string;
        }[];
      };
    };
  }[];
}

// Populate CVE details from the NVD.
const populateVulnerabilities = async () => {
  const vulnerabilities = await Vulnerability.find({
    needsPopulation: true
  });
  const vulnerabilitiesMap: { [key: string]: Vulnerability[] } = {};
  for (const vuln of vulnerabilities) {
    if (vuln.cve) {
      if (vulnerabilitiesMap[vuln.cve]) {
        vulnerabilitiesMap[vuln.cve].push(vuln);
      } else vulnerabilitiesMap[vuln.cve] = [vuln];
    }
  }
  const filenames = await fs.promises.readdir('nvd-dump');
  for (const file of filenames) {
    // Only process yearly CVE files, e.g. nvdcve-1.1-2014.json.gz
    if (!file.match(/nvdcve-1\.1-\d{4}\.json\.gz/)) continue;
    const contents = await fs.promises.readFile('nvd-dump/' + file);
    const unzipped = zlib.unzipSync(contents);
    const parsed: NvdFile = JSON.parse(unzipped.toString());
    for (const item of parsed.CVE_Items) {
      const cve = item.cve.CVE_data_meta.ID;
      if (vulnerabilitiesMap[cve]) {
        console.log(cve);
        const vulns = vulnerabilitiesMap[cve];
        const description = item.cve.description.description_data.find(
          (desc) => desc.lang === 'en'
        );
        for (const vuln of vulns) {
          if (description) vuln.description = description.value;
          vuln.references = item.cve.references.reference_data.map((r) => ({
            url: r.url,
            name: r.name,
            source: r.refsource,
            tags: r.tags
          }));
          vuln.needsPopulation = false;
          await vuln.save();
        }
      }
    }
  }
};

// Closes or reopens vulnerabilities that need to be updated
const adjustVulnerabilities = async (type: 'open' | 'closed') => {
  const twoDaysAgo = new Date(
    new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 2)
  );
  const where: {
    state: string;
    lastSeen: FindOperator<Date>;
    substate?: string;
  } = {
    state: type,
    lastSeen: type === 'open' ? LessThan(twoDaysAgo) : MoreThan(twoDaysAgo)
  };
  // If vulnerability is already closed, we should only reopen if it was remediated
  if (type === 'closed') {
    where.substate = 'remediated';
  }
  const openVulnerabilites = await Vulnerability.find({
    where
  });
  for (const vulnerability of openVulnerabilites) {
    vulnerability.setState(
      type === 'open' ? 'remediated' : 'unconfirmed',
      true,
      null
    );
    await vulnerability.save();
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  console.log('Running cve detection globally');

  // CVE is a global scan; organizationId is used only for testing.
  const { organizationId } = commandOptions;

  await connectToDatabase();
  const allDomains = await Domain.find({
    select: ['id', 'name', 'ip', 'ssl'],
    relations: ['services'],
    where: organizationId ? { organization: { id: organizationId } } : undefined
  });
  await identifyPassiveCVEsFromCPEs(allDomains);

  // await identifyUnexpectedWebpages(allDomains);

  await identifyExpiringCerts(allDomains);

  await adjustVulnerabilities('open');
  await adjustVulnerabilities('closed');

  await populateVulnerabilities();
};
