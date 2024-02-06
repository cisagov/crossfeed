import { CommandOptions } from './ecs-client';
import { Domain, Service, Vulnerability, Organization } from '../models';
import { plainToClass } from 'class-transformer';
import axios from 'axios';
import pRetry from 'p-retry';
import saveServicesToDb from './helpers/saveServicesToDb';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import saveDomainsReturn from './helpers/saveDomainsReturn';
import { IpToDomainsMap, sanitizeStringField } from './censysIpv4';
import getScanOrganizations from './helpers/getScanOrganizations';

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
  console.log('Creating task to fetch CVE data');
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
        org_id: org_name
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
    `Scanning PE database for vulnerabilities & services for organization ${organizationId}...`
  );
  try {
    //if (organizationName === 'GLOBAL SCAN') {
    //TODO: get all the organizations and scan them
    if (organizationName === 'GLOBAL SCAN' || organizationName === undefined) {
      console.log('Org must be defined and not GLOBAL SCAN');
      return;
    }
    const data = await fetchPEVulnTask(organizationName);
    if (data?.task_id === undefined) {
      console.error('Failed to fetch PE vulns');
      return;
    }
    let allVulns: UniversalCrossfeedVuln[] = [];
    for (const taskId of data.task_id) {
      let response = await fetchPEVulnData(taskId);
      while (response && response.status === 'Pending') {
        await sleep(1000);
        response = await fetchPEVulnData(taskId);
      }
      if (response && response.status === 'Failure') {
        console.error('Failed for task id: ' + taskId);
        continue; // Go to the next item in the for loop
      }
      allVulns = allVulns.concat(response?.result ?? []);
      await sleep(1000); // Delay between API requests
    }

    for (const item of allVulns ?? []) {
      const domainId = await saveDomainsReturn([
        plainToClass(Domain, {
          name: item.service_asset,
          organization: { id: organizationId }, //change this for global scan to get all the organizations
          fromRootDomain: item.service_asset,
          discoveredBy: { id: commandOptions.scanId }
        })
      ]);
      console.log('DOMAINID: ');
      console.log(domainId?.id);
      const [serviceId] = await saveServicesToDb([
        plainToClass(Service, {
          domain: item.service_asset,
          discoveredBy: { id: commandOptions.scanId },
          port: item.service_port,
          lastSeen: item.lastSeen,
          banner: sanitizeStringField(item.banner),
          serviceSource: item.serviceSource,
          ...(item.source === 'Shodan'
            ? {
                shodanResults: {
                  product: item.product,
                  version: item.version,
                  cpe: item.cpe
                }
              }
            : {})
        })
      ]);
      console.log('saved services');
      const vulns: Vulnerability[] = [];
      vulns.push(
        plainToClass(Vulnerability, {
          domain: item.service_asset,
          lastSeen: item.lastSeen,
          title: item.title,
          cve: item.cve,
          cvss: item.cvss,
          state: item.state,
          source: item.source,
          needsPopulation: item.needsPopulation,
          service: { id: serviceId }
        })
      );
      await saveVulnerabilitiesToDb(vulns, false);
    }
  } catch (e) {
    console.error(e);
  }
  await sleep(1000); //Not overload P&E API
  console.log(`Finished retriving info for organization ${organizationId}...`);
};
