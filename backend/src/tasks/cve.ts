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
import {
  LessThan,
  MoreThan,
  FindOperator,
  In,
  MoreThanOrEqual,
  Not
} from 'typeorm';
import * as fs from 'fs';
import * as zlib from 'zlib';
import axios, { AxiosResponse } from 'axios';
import { CISACatalogOfKnownExploitedVulnerabilities } from 'src/models/generated/kev';

/**
 * The CVE scan creates vulnerabilities based on existing
 * data (such as product version numbers / CPEs, webpages)
 * that have already been collected from other scans.
 * 
 * To manually test the CVE tools from your command line, run:

nvdsync -cve_feed cve-1.1.json.gz nvd-dump

cpe2cve -d ' ' -d2 , -o ' ' -o2 , -cpe 2 -e 2 -matches 3 -cve 2 -cvss 4 -cwe 5 -require_version nvd-dump/nvdcve-1.1-2*.json.gz

Then input:

0 cpe:/a:microsoft:exchange_server:2019:cumulative_update_3

Press ctrl + D to end input.

*/

// Stores alternate CPEs. Sometimes, CPEs are renamed or equivalent to other CPEs,
// so we want to input all variants so we get all applicable vulnerabilities.
const productMap = {
  'cpe:/a:microsoft:asp.net': ['cpe:/a:microsoft:.net_framework'],
  'cpe:/a:microsoft:internet_information_server': [
    'cpe:/a:microsoft:internet_information_services'
  ],
  'cpe:/a:microsoft:iis': ['cpe:/a:microsoft:internet_information_services']
};

// The number of domains to fetch from the database
// at once.
const DOMAIN_BATCH_SIZE = 1000;

// The number of domains to send to cpe2cve at once.
// This should be a small enough number
const CPE2CVE_BATCH_SIZE = 50;

// URL for CISA's Known Exploited Vulnerabilities database.
const KEV_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

/**
 * Construct a CPE to be added. If the CPE doesn't already contain
 * the version, then add the version to the CPE.
 */
const constructCPE = (cpe: string, version: string) => {
  if (
    cpe?.indexOf(String(version)) > -1 ||
    cpe.indexOf('exchange_server') > -1
  ) {
    // CPE already has the product version. Just return it.
    return cpe;
  }
  if (cpe.endsWith(':')) {
    // Remove trailing colons from CPE, if present
    cpe = cpe.slice(0, -1);
  }
  return `${cpe}:${version}`;
};

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
          const cpe = constructCPE(product.cpe, product.version);
          cpes.add(cpe);
          // Add alternate variants of the CPE as well.
          for (const productMapCPE in productMap) {
            if (cpe.indexOf(productMapCPE) > -1) {
              for (const alternateCPE of productMap[productMapCPE]) {
                cpes.add(
                  constructCPE(
                    cpe.replace(productMapCPE, alternateCPE),
                    product.version
                  )
                );
              }
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

  spawnSync('nvdsync', ['-cve_feed', 'cve-1.1.json.gz', 'nvd-dump'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  if (hostsToCheck.length === 0) {
    console.warn('No hosts to check - no domains with CPEs found.');
    return;
  }

  const numBatches = hostsToCheck.length / CPE2CVE_BATCH_SIZE;
  for (let batch = 0; batch < numBatches; batch++) {
    let input = '';
    console.log(`\tcpe2cve: starting batch ${batch} / ${numBatches}`);
    for (
      let index = CPE2CVE_BATCH_SIZE * batch;
      index < Math.min(CPE2CVE_BATCH_SIZE * (batch + 1), hostsToCheck.length);
      index++
    ) {
      input += `${index} ${hostsToCheck[index].cpes.join(',')}\n`;
      console.log(`\t${index} ${hostsToCheck[index].cpes.join(',')}`);
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
      vulnerabilities.push(
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          title: parts[1],
          cve: parts[1],
          cwe: parts[4],
          cpe: parts[2],
          cvss,
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
 * Identifies expired and soon-to-expire certificates, as well
 * as invalid certificates.
 */
const identifyExpiringCerts = async (allDomains: Domain[]) => {
  const oneWeekFromNow = new Date(
    new Date(Date.now()).setDate(new Date(Date.now()).getDate() + 7)
  );
  const vulnerabilities: Vulnerability[] = [];
  for (const domain of allDomains) {
    const { validTo, valid } = domain.ssl || {};
    if (valid === false) {
      vulnerabilities.push(
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          title: `Invalid SSL certificate`,
          severity: 'Low',
          state: 'open',
          source: 'certs',
          description: `This domain's SSL certificate is invalid. Please make sure its certificate is properly configured, or users may face SSL errors when trying to navigate to the site.`
        })
      );
    } else if (validTo && new Date(validTo) <= oneWeekFromNow) {
      vulnerabilities.push(
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          title: `Expiring SSL certificate`,
          severity: 'High',
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
const populateVulnerabilitiesFromNVD = async () => {
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

  //  moment(date, 'YYYY-MM-DD').toDate()
};

// Populate CVE details from the CISA Known Exploited Vulnerabilities (KEV) database.
const populateVulnerabilitiesFromKEV = async () => {
  const response: AxiosResponse<CISACatalogOfKnownExploitedVulnerabilities> = await axios.get(
    KEV_URL
  );
  const { vulnerabilities: kevVulns } = response.data;
  for (const kevVuln of kevVulns) {
    const { affected = 0 } = await Vulnerability.update(
      {
        isKev: Not(true),
        cve: kevVuln.cveID
      },
      {
        isKev: true,
        kevResults: kevVuln as any
      }
    );
    if (affected > 0) {
      console.log(`KEV ${kevVuln.cveID}: updated ${affected} vulns`);
    }
  }
};

// Close open vulnerabilities that haven't been seen in a week.
const closeOpenVulnerabilities = async () => {
  const oneWeekAgo = new Date(
    new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 7)
  );
  const openVulnerabilites = await Vulnerability.find({
    where: {
      state: 'open',
      lastSeen: LessThan(oneWeekAgo)
    }
  });
  for (const vulnerability of openVulnerabilites) {
    vulnerability.setState('remediated', true, null);
    await vulnerability.save();
  }
};

// Reopen closed vulnerabilities that have been seen in the past week.
const reopenClosedVulnerabilities = async () => {
  const oneWeekAgo = new Date(
    new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 7)
  );
  const remediatedVulnerabilities = await Vulnerability.find({
    where: {
      state: 'closed',
      lastSeen: MoreThan(oneWeekAgo),
      substate: 'remediated'
    }
  });
  for (const vulnerability of remediatedVulnerabilities) {
    vulnerability.setState('unconfirmed', true, null);
    await vulnerability.save();
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  console.log('Running cve detection globally');

  // CVE is a global scan; organizationId is used only for testing.
  const { organizationId } = commandOptions;

  await connectToDatabase();

  // Fetch all domains in batches.
  for (let batchNum = 0; ; batchNum++) {
    const domains = await Domain.find({
      select: ['id', 'name', 'ip', 'ssl'],
      relations: ['services'],
      where: organizationId
        ? { organization: { id: organizationId } }
        : undefined,
      skip: batchNum * DOMAIN_BATCH_SIZE,
      take: DOMAIN_BATCH_SIZE
    });

    if (domains.length == 0) {
      // No more domains
      break;
    }

    console.log(`Running batch ${batchNum}`);

    await identifyPassiveCVEsFromCPEs(domains);

    await identifyExpiringCerts(domains);
  }

  // await identifyUnexpectedWebpages(domains);

  await closeOpenVulnerabilities();
  await reopenClosedVulnerabilities();

  await populateVulnerabilitiesFromNVD();

  await populateVulnerabilitiesFromKEV();
};
