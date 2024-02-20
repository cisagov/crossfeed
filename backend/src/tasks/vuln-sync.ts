import { CommandOptions } from './ecs-client';
import {
  connectToDatabase,
  Domain,
  Service,
  Vulnerability,
  Organization
} from '../models';
import { plainToClass } from 'class-transformer';
import axios from 'axios';
import pRetry from 'p-retry';
import saveServicesToDb from './helpers/saveServicesToDb';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import saveDomainsReturn from './helpers/saveDomainsReturn';
import { IpToDomainsMap, sanitizeStringField } from './censysIpv4';

interface UniversalCrossfeedVuln {
  title: string;
  cve: string;
  cvss: string;
  state: string;
  severity: string;
  source: string;
  needsPopulation: boolean;
  port: number;
  lastSeen: Date;
  banner: string;
  serviceSource: string;
  product: string;
  version: string;
  cpe: string;
  service_asset: string;
  service_port: string;
  service_asset_type: string;
}
interface TaskResponse {
  task_id: string[];
  status: 'Pending' | 'Completed' | 'Failure';
  result: UniversalCrossfeedVuln[];
  error?: string;
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const fetchPEVulnTask = async (org_name: string) => {
  console.log('Creating task to fetch PE vuln data');
  try {
    console.log(String(process.env.CF_API_KEY));
    const response = await axios({
      url: 'https://api.staging-cd.crossfeed.cyber.dhs.gov/pe/apiv1/crossfeed_vulns',
      method: 'POST',
      headers: {
        Authorization: String(process.env.CF_API_KEY),
        access_token: String(process.env.PE_API_KEY),
        'Content-Type': '' //this is needed or else it breaks because axios defaults to application/json
      },
      data: {
        org_name: org_name
      }
    });
    if (response.status >= 200 && response.status < 300) {
      console.log('Request was successful');
    } else {
      console.log('Request failed');
    }
    return response.data as TaskResponse;
  } catch (error) {
    console.log(`Error making POST request: ${error}`);
  }
};

const fetchPEVulnData = async (task_id: string) => {
  console.log('Creating task to fetch CVE data');
  try {
    const response = await axios({
      url: `https://api.staging-cd.crossfeed.cyber.dhs.gov/pe/apiv1/crossfeed_vulns/task/${task_id}`,
      headers: {
        Authorization: String(process.env.CF_API_KEY),
        access_token: String(process.env.PE_API_KEY),
        'Content-Type': '' //this is needed or else it breaks because axios defaults to application/json
      }
    });
    if (response.status >= 200 && response.status < 300) {
      console.log('Request was successful');
    } else {
      console.log('Request failed');
    }
    return response.data as TaskResponse;
  } catch (error) {
    console.log(`Error making POST request: ${error}`);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log(
    `Scanning PE database for vulnerabilities & services for all orgs`
  );
  try {
    // Get all organizations
    await connectToDatabase();
    const allOrgs: Organization[] = await Organization.find();
    console.log(allOrgs);

    // For each organization, fetch vulnerability data
    for (const org of allOrgs) {
      console.log(
        `Scanning PE database for vulnerabilities & services for ${org.acronym}, ${org.name}`
      );
      // Start API task
      const data = await fetchPEVulnTask(org.acronym);
      if (data?.task_id === undefined) {
        console.error(
          `Failed to fetch PE vulns for org: ${org.acronym}, ${org.name}`
        );
        continue;
      }
      let allVulns: UniversalCrossfeedVuln[] = [];

      // For each task, call endpoint to get data
      for (const taskId of data.task_id) {
        let response = await fetchPEVulnData(taskId);
        while (response && response.status === 'Pending') {
          await sleep(1000);
          response = await fetchPEVulnData(taskId);
        }
        if (response && response.status === 'Failure') {
          console.error(
            `Failed for task id: ${taskId} for org ${org.acronym}, ${org.name}`
          );
          continue; // Go to the next item in the for loop
        }
        allVulns = allVulns.concat(response?.result ?? []);
        await sleep(1000); // Delay between API requests
      }

      // For each vulnaribility, save assets
      for (const vuln of allVulns ?? []) {
        console.log(vuln);
        // Save discovered domains to the Domain table
        const domainId = await saveDomainsReturn([
          plainToClass(Domain, {
            name: vuln.service_asset,
            organization: { id: org.id }, //change this for global scan to get all the organizations
            fromRootDomain: vuln.service_asset,
            discoveredBy: { id: commandOptions.scanId }
          })
        ]);
        if (domainId === undefined || domainId.id === null) {
          console.error(`Failed to save domain ${vuln.service_asset}`);
          continue;
        }

        // Save discovered services to the Service table
        const [serviceId] = await saveServicesToDb([
          plainToClass(Service, {
            domain: { id: domainId.id },
            discoveredBy: { id: commandOptions.scanId },
            port: vuln.service_port,
            lastSeen: vuln.lastSeen,
            banner: sanitizeStringField(vuln.banner),
            serviceSource: vuln.serviceSource,
            ...(vuln.source === 'Shodan'
              ? {
                  shodanResults: {
                    product: vuln.product,
                    version: vuln.version,
                    cpe: vuln.cpe
                  }
                }
              : {})
          })
        ]);
        // Save to the Vulnerability table
        console.log('saved services');
        const vulns: Vulnerability[] = [];
        vulns.push(
          plainToClass(Vulnerability, {
            domain: vuln.service_asset,
            lastSeen: vuln.lastSeen,
            title: vuln.title,
            cve: vuln.cve,
            cvss: vuln.cvss,
            state: vuln.state,
            source: vuln.source,
            needsPopulation: vuln.needsPopulation,
            service: { id: serviceId }
          })
        );
        await saveVulnerabilitiesToDb(vulns, false);
      }
    }
  } catch (e) {
    console.error(e);
  }
  await sleep(1000); // Do avoid overloading the P&E API
  console.log(`Finished retriving PE vulns for all orgs`);
};
