import { CommandOptions } from './ecs-client';
import { Domain, Service, Vulnerability } from '../models';
import { plainToClass } from 'class-transformer';
import axios from 'axios';
import pRetry from 'p-retry';
import saveServicesToDb from './helpers/saveServicesToDb';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { IpToDomainsMap, sanitizeStringField } from './censysIpv4';

interface UniversalCrossfeedVuln {
    task_id: string;
    status: 'Pending' | 'Completed' | 'Failed';
    result?:{
        [title: string]: {
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
        };
    }
}
interface TaskResponse {
    task_id: string;
    status: 'Pending' | 'Completed' | 'Failure';
}

const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

export const handler = async (commandOptions: CommandOptions) => {
    const{ organizationId, organizationName } = commandOptions; 

    console.log(
        `Scanning PE database for vulnerabilities & servuces for organization ${organizationId}...`
      );
    try {
        let {taskInfo} = await pRetry(
            () =>
                axios.post<TaskResponse>(`https://localhost/crossfeed_vulns`, {
                    api_key: process.env.SHODAN_API_KEY, //TODO: define this
                    org_id: organizationId
                }),
            { retries: 3 }
          );
        let {response} = await pRetry(
            () => {
                const resp = axios.get<UniversalCrossfeedVuln>(`https://localhost/crossfeed_vulns/task/${taskInfo.task_id}`)
                if (response.status === 'Pending') {
                    throw new Error('Task not complete.');
                  }
                  return resp
            },
            { retries: 1000 }
        );

        if (response.status == 'Failed') throw new Error('P&E Api Task Failure, nothing changed.');
        
        for (const item of response.result) {
            const [serviceId] = await saveServicesToDb(
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
            );
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