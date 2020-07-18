import axios from 'axios';
import { Domain, Organization, Service } from '../models';
import { plainToClass } from 'class-transformer';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { CommandOptions } from './ecs-client';
import getCensysBannerData from './helpers/getCensysIpv4Data';
import getCensysIpv4Data from './helpers/__mocks__/getCensysIpv4Data';
import { CensysIpv4Data } from 'src/models/generated/censysIpv4';
import { mapping } from './censys/mapping';
import saveServicesToDb from './helpers/saveServicesToDb';
import getAllDomains from './helpers/getAllDomains';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  // console.log('Running censys on organization', organizationName);

  const data: CensysIpv4Data[] = await getCensysIpv4Data();

  // schema: https://censys.io/help/bigquery/ipv4

  const allDomains = await getAllDomains();
  const allDomainIps = allDomains.map(e => e.ip);
  const domains: Domain[] = [];
  let services: Service[] = [];
  for (let item of data) {
    if (!item.ip) {
      continue;
    }
    // We could have multiple matching domains (virtual hosts)
    // TODO: include IPs without an associated domain.
    const matchingDomains = allDomains.filter(e => e.ip === item.ip);
    for (let matchingDomain of matchingDomains) {
      domains.push(
        plainToClass(Domain, {
          name: matchingDomain.name,
          asn: item.autonomous_system?.asn,
          ip: item.ip,
          country: item.location?.country_code,
          lastSeen: new Date(Date.now())
        })
      );
      for (let key in item) {
        if (key.startsWith("p") && mapping[key]) {
          const service = Object.keys(item[key] as any)[0];
          services.push(
            plainToClass(Service, {
              ...mapping[key](item[key]),
              service,
              port: Number(key.slice(1)),
              domain: matchingDomain
            })
          );
        }
      }
    }
  }
  saveDomainsToDb(domains);
  saveServicesToDb(services);
  // console.log(`[censys] done, saved or updated ${domains.length} domains`);
};
