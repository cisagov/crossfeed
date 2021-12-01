import { Domain, Service, Vulnerability } from '../models';
import { plainToClass } from 'class-transformer';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import saveServicesToDb from './helpers/saveServicesToDb';
import { chunk } from 'lodash';
import axios from 'axios';
import pRetry from 'p-retry';
import { IpToDomainsMap, sanitizeStringField } from './censysIpv4';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';

// Shodan allows searching up to 100 IPs at once
const CHUNK_SIZE = 100;

interface ShodanResponse {
  ip_str: string;
  country_name: string;
  domains: string[];
  hostnames: string[];
  org: string;
  ports: number[];
  os: string;
  city: string;
  longitude: number;
  latitude: number;
  data: {
    port: number;
    product: string;
    data: string;
    cpe: string[];
    version: string;
    vulns: {
      [title: string]: {
        verified: boolean;
        references: string[];
        cvss: number;
        summary: string;
      };
    };
  }[];
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running shodan on organization', organizationName);

  const domainsWithIPs = await getIps(organizationId);

  const ipToDomainsMap: IpToDomainsMap = domainsWithIPs.reduce<IpToDomainsMap>(
    (map: IpToDomainsMap, domain: Domain) => {
      if (!map[domain.ip]) {
        map[domain.ip] = [];
      }
      map[domain.ip].push(domain);
      return map;
    },
    {}
  );

  const chunks = chunk(domainsWithIPs, CHUNK_SIZE);

  for (const domainChunk of chunks) {
    console.log(
      `Scanning ${domainChunk.length} domains beginning with ${domainChunk[0].name}`
    );
    try {
      let { data } = await pRetry(
        () =>
          axios.get<ShodanResponse[]>(
            `https://api.shodan.io/shodan/host/${encodeURI(
              domainChunk.map((domain) => domain.ip).join(',')
            )}?key=${process.env.SHODAN_API_KEY}`
          ),
        {
          // Perform less retries on jest to make tests faster
          retries: typeof jest === 'undefined' ? 5 : 2,
          minTimeout: 1000
        }
      );

      // If only one item is returned, the response will not be an array
      if (!Array.isArray(data)) {
        data = [data];
      }
      for (const item of data) {
        const domains = ipToDomainsMap[item.ip_str];
        for (const domain of domains) {
          for (const service of item.data) {
            const [serviceId] = await saveServicesToDb([
              plainToClass(Service, {
                domain: domain,
                discoveredBy: { id: commandOptions.scanId },
                port: service.port,
                lastSeen: new Date(Date.now()),
                banner: sanitizeStringField(service.data),
                serviceSource: 'shodan',
                shodanResults: {
                  product: service.product,
                  version: service.version,
                  cpe: service.cpe
                }
              })
            ]);
            if (service.vulns) {
              const vulns: Vulnerability[] = [];
              for (const cve in service.vulns) {
                // console.log('Creating vulnerability', cve);
                vulns.push(
                  plainToClass(Vulnerability, {
                    domain: domain,
                    lastSeen: new Date(Date.now()),
                    title: cve,
                    cve: cve,
                    // Shodan CPE information is unreliable,
                    // so don't add it in for now.
                    // cpe:
                    //   service.cpe && service.cpe.length > 0
                    //     ? service.cpe[0]
                    //     : null,
                    cvss: service.vulns[cve].cvss,
                    state: 'open',
                    source: 'shodan',
                    needsPopulation: true,
                    service: { id: serviceId }
                  })
                );
              }
              await saveVulnerabilitiesToDb(vulns, false);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    await sleep(1000); // Wait for Shodan rate limit of 1 request / second
  }

  console.log(`Shodan finished for ${domainsWithIPs.length} domains`);
};
