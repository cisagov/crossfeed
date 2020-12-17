import { Domain, Service, Vulnerability } from '../models';
import { plainToClass } from 'class-transformer';
import * as portscanner from 'portscanner';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import saveServicesToDb from './helpers/saveServicesToDb';
import { chunk } from 'lodash';
import axios from 'axios';
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
    const { data } = await axios.get<ShodanResponse[]>(
      `https://api.shodan.io/shodan/host/${domainChunk
        .map((domain) => domain.ip)
        .join(',')}?key=${process.env.SHODAN_API_KEY}`
    );
    const services: Service[] = [];
    const vulns: Vulnerability[] = [];
    for (const item of data) {
      const domains = ipToDomainsMap[item.ip_str];
      for (const domain of domains) {
        for (const service of item.data) {
          services.push(
            plainToClass(Service, {
              domain: domain,
              discoveredBy: { id: commandOptions.scanId },
              port: service.port,
              lastSeen: new Date(Date.now()),
              banner: sanitizeStringField(service.data),
              shodanResults: {
                product: service.product,
                version: service.version,
                cpe: service.cpe
              }
            })
          );
          if (service.vulns) {
            for (const cve in service.vulns) {
              vulns.push(
                plainToClass(Vulnerability, {
                  domain: domain,
                  lastSeen: new Date(Date.now()),
                  title: cve,
                  cve: cve,
                  cpe:
                    service.cpe && service.cpe.length > 0
                      ? service.cpe[0]
                      : null,
                  cvss: service.vulns[cve].cvss,
                  state: 'open',
                  source: 'shodan',
                  description: service.vulns[cve].summary,
                  needsPopulation: true
                })
              );
            }
          }
        }
      }
    }
    await saveServicesToDb(services);
    await saveVulnerabilitiesToDb(vulns, false);
  }

  console.log(`Shodan finished for ${domainsWithIPs.length} domains`);
};
