import { CommandOptions } from './ecs-client';
import { Domain, Service, Vulnerability } from '../models';
import { plainToClass } from 'class-transformer';
import axios from 'axios';
import pRetry from 'p-retry';
import saveServicesToDb from './helpers/saveServicesToDb';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { IpToDomainsMap, sanitizeStringField } from './censysIpv4';

interface UniversalCrossfeedVuln {   
    title: string
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
    task_id: string;
    status: 'Pending' | 'Completed' | 'Failure';
    result: UniversalCrossfeedVuln[];
}

const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  const fetchPEVulnTask = async (org_name : string) => {
    console.log(
      `[PE Vuln Synnc] Fetching vulnerabilities for org "${org_name}"`
    );
    const { data, status } = await axios({
      url: '`https://localhost/crossfeed_vulns`',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        ApiKey: process.env.PE_API_KEY, //TODO: define this
        org_id: org_name
      }
    });
    return data as TaskResponse;
  };
  const fetchPEVulnData = async (task_id:string) => {
    console.log(
      `[PE Vuln Synnc] Fetching vulnerabilities for task "${task_id}"`
    );
    const { data, status } = await axios({
      url: `https://localhost/crossfeed_vulns/task/${task_id}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        ApiKey: process.env.PE_API_KEY, //TODO: define this
      }
    });
    return data as TaskResponse;
  
  }

export const handler = async (commandOptions: CommandOptions) => {
    const{ organizationId, organizationName } = commandOptions; 

    console.log(
        `Scanning PE database for vulnerabilities & servuces for organization ${organizationId}...`
      );
    try {
        let data: TaskResponse;
        if (typeof organizationName !== 'undefined') {
            data = await fetchPEVulnTask(organizationName);
        } else {
            throw new Error('org_name is undefined');
        }


        let response = await fetchPEVulnData(data.task_id);
        while (response.status === 'Pending') {
            await sleep(1000);
            response = await fetchPEVulnData(data.task_id);
        }
        if (response.status === 'Failure') {
            console.error('Failed to fetch PE vulns');
            return;
        }
        for (const item of response.result) {
            const [serviceId] = await saveServicesToDb([
                plainToClass(Service, {
                    domain: item.service_asset,
                    discoveredBy: { id: commandOptions.scanId },
                    port: item.service_port,
                    lastSeen: item.lastSeen,
                    banner: sanitizeStringField(item.banner),
                    serviceSource: item.serviceSource,
                    ...(item.source === 'Shodan' ? {
                        shodanResults: {
                            product: item.product,
                            version: item.version,
                            cpe: item.cpe
                        }
                    } : {})
                })
            ]);
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
                    service: { id: serviceId},
                })
            );
            await saveVulnerabilitiesToDb(vulns, false);
            
        }
    } catch(e){
        console.error(e);
    }
    await sleep(1000); //Not overload P&E API
    console.log(`Finished retriving info for organization ${organizationId}...`)
}