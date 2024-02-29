import { CommandOptions } from './ecs-client';
import {
  connectToDatabase,
  Domain,
  Service,
  Vulnerability,
  Organization
} from '../models';
import { plainToClass } from 'class-transformer';
import * as dns from 'dns';
import axios from 'axios';
import saveServicesToDb from './helpers/saveServicesToDb';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import saveDomainsReturn from './helpers/saveDomainsReturn';
import { sanitizeStringField } from './censysIpv4';

interface UniversalCrossfeedVuln {
  title: string;
  cve: string;
  cwe: string;
  description: string;
  cvss: string;
  state: string;
  severity: string;
  source: string;
  needsPopulation: boolean;
  port: number;
  last_seen: string;
  banner: string;
  serviceSource: string;
  product: string;
  version: string;
  cpe: string;
  service_asset: string;
  service_port: string;
  service_asset_type: string;
  structuredData?: { [key: string]: any };
}
interface TaskResponse {
  tasks_dict: { [key: string]: string };
  status: 'Pending' | 'Completed' | 'Failure';
  result: UniversalCrossfeedVuln[];
  error?: string;
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const fetchPEVulnTask = async (org_acronym: string) => {
  console.log('Creating task to fetch PE vuln data');
  try {
    console.log(String(process.env.CF_API_KEY));
    const response = await axios({
      url: 'https://api.staging-cd.crossfeed.cyber.dhs.gov/pe/apiv1/crossfeed_vulns',
      method: 'POST',
      headers: {
        Authorization: String(process.env.CF_API_KEY),
        access_token: String(process.env.PE_API_KEY),
        'Content-Type': '' // This is needed or else it breaks because axios defaults to application/json
      },
      data: {
        org_acronym: org_acronym
      }
    });
    if (response.status >= 200 && response.status < 300) {
      console.log('Task request was successful');
    } else {
      console.log('Task request failed');
    }
    return response.data as TaskResponse;
  } catch (error) {
    console.log(`Error making POST request: ${error}`);
  }
};

const fetchPEVulnData = async (scan_name: string, task_id: string) => {
  console.log('Creating task to fetch CVE data');
  try {
    const response = await axios({
      url: `https://api.staging-cd.crossfeed.cyber.dhs.gov/pe/apiv1/crossfeed_vulns/task/?task_id=${task_id}&scan_name=${scan_name}`,
      headers: {
        Authorization: String(process.env.CF_API_KEY),
        access_token: String(process.env.PE_API_KEY),
        'Content-Type': '' // This is needed or else it breaks because axios defaults to application/json
      }
    });
    if (response.status >= 200 && response.status < 300) {
      console.log('Request was successful');
    } else {
      console.log('Request failed');
    }
    return response.data as TaskResponse;
  } catch (error) {
    console.log(`Error making GET request: ${error}`);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  console.log(
    `Scanning PE database for vulnerabilities & services for all orgs`
  );
  try {
    // Get all organizations
    await connectToDatabase();
    const allOrgs: Organization[] = await Organization.find();

    // For each organization, fetch vulnerability data
    for (const org of allOrgs) {
      console.log(
        `Scanning PE database for vulnerabilities & services for ${org.acronym}, ${org.name}`
      );
      // Start API task
      const data = await fetchPEVulnTask(org.acronym);
      if (data?.tasks_dict === undefined) {
        console.error(
          `Failed to start P&E API task for org: ${org.acronym}, ${org.name}`
        );
        continue;
      }
      let allVulns: UniversalCrossfeedVuln[] = [];

      // For each task, call endpoint to get data
      for (const scan_name in data.tasks_dict) {
        const task_id = data.tasks_dict[scan_name];
        let response = await fetchPEVulnData(scan_name, task_id);
        while (response && response.status === 'Pending') {
          await sleep(1000);
          response = await fetchPEVulnData(scan_name, task_id);
        }
        if (response && response.status === 'Failure') {
          console.error(
            `Failed fetching data for task id: ${task_id} for org ${org.acronym}, ${org.name}`
          );
          continue; // Go to the next item in the for loop
        }
        allVulns = allVulns.concat(response?.result ?? []);
        await sleep(1000); // Delay between API requests
      }

      // For each vulnerability, save assets
      for (const vuln of allVulns ?? []) {
        // Save discovered domains and ips to the Domain table
        let domainId;
        let service_domain;
        let service_ip;
        let ipOnly = false;
        try {
          // Lookup domain based on IP
          if (vuln.service_asset_type === 'ip') {
            service_ip = vuln.service_asset;
            try {
              service_domain = (await dns.promises.reverse(service_ip))[0];
              console.log(service_domain);
            } catch {
              console.log(`Setting domain to IP: ${service_ip}`);
              service_domain = service_ip;
              ipOnly = true;
            }
            service_ip = vuln.service_asset;
            // Lookup IP based on domain
          } else {
            service_domain = vuln.service_asset;
            try {
              service_ip = (await dns.promises.lookup(service_domain)).address;
            } catch {
              service_ip = null;
            }
          }
          [domainId] = await saveDomainsReturn([
            plainToClass(Domain, {
              name: service_domain,
              ip: service_ip,
              organization: { id: org.id },
              fromRootDomain: !ipOnly
                ? service_domain.split('.').slice(-2).join('.')
                : null,
              discoveredBy: { id: commandOptions.scanId },
              subdomainSource: `P&E - ${vuln.source}`,
              ipOnly: ipOnly
            })
          ]);
          console.log(`Successfully saved domain with id: ${domainId}`);
        } catch (e) {
          console.error(`Failed to save domain ${vuln.service_asset}`);
          console.error(e);
          console.error('Continuing to next vulnerability');
          continue;
        }

        let serviceId;
        if (vuln.port != null) {
          try {
            // Save discovered services to the Service table
            [serviceId] = await saveServicesToDb([
              plainToClass(Service, {
                domain: { id: domainId },
                discoveredBy: { id: commandOptions.scanId },
                port: vuln.port,
                lastSeen: new Date(vuln.last_seen),
                banner:
                  vuln.banner == null ? null : sanitizeStringField(vuln.banner),
                serviceSource: vuln.source,
                shodanResults:
                  vuln.source === 'shodan'
                    ? {
                        product: vuln.product,
                        version: vuln.version,
                        cpe: vuln.cpe
                      }
                    : {}
              })
            ]);
            console.log('Saved services.');
          } catch (e) {
            console.error(
              'Could not save services. Continuing to next vulnerability.'
            );
            console.error(e);
            continue;
          }
        }

        try {
          const vulns: Vulnerability[] = [];
          vulns.push(
            plainToClass(Vulnerability, {
              domain: domainId,
              lastSeen: vuln.last_seen,
              title: vuln.title,
              cve: vuln.cve,
              cwe: vuln.cwe,
              description: vuln.description,
              cvss: vuln.cvss,
              severity: vuln.severity,
              state: vuln.state,
              structuredData: vuln.structuredData,
              source: vuln.source,
              needsPopulation: vuln.needsPopulation,
              service: vuln.port == null ? null : { id: serviceId }
            })
          );
          await saveVulnerabilitiesToDb(vulns, false);
        } catch (e) {
          console.error('Could not save vulnerabilities. Continuing.');
          console.error(e);
        }
      }
    }
  } catch (e) {
    console.error('Unknown failure.');
    console.error(e);
  }
  await sleep(1000); // Do avoid overloading the P&E API
  console.log(`Finished retrieving PE vulns for all orgs`);
};
