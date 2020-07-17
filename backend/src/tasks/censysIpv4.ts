import axios from 'axios';
import { Domain, Organization, Service } from '../models';
import { plainToClass } from 'class-transformer';
import * as dns from 'dns';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { CommandOptions } from './ecs-client';
import getCensysBannerData from './helpers/getCensysIpv4Data';
import getCensysIpv4Data from './helpers/__mocks__/getCensysIpv4Data';
import { CensysIpv4Data } from 'src/models/generated/censysIpv4';
import { getServices } from "./censys/services";


export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  // console.log('Running censys on organization', organizationName);

  const data: CensysIpv4Data[] = await getCensysIpv4Data();

  // schema: https://censys.io/help/bigquery/ipv4

  const domains: Domain[] = [];
  let services: Service[] = [];
  for (let item of data) {
    domains.push(
      plainToClass(Domain, {
        // domain: domain,
        asn: item.autonomous_system?.asn,
        ip: item.ip,
        country: item.location?.country_code,
        lastSeen: new Date(Date.now())
      })
    );
    services = [...services, ...Array.from(getServices(item)).map(e => plainToClass(Service, e))];
  }

  // for (const domain of foundDomains) {
  //   let ip: string | null;
  //   try {
  //     ip = (await dns.promises.lookup(domain.name)).address;
  //   } catch {
  //     // IP not found
  //     ip = null;
  //   }
  //   domains.push(
  //     plainToClass(Domain, {
  //       ip: ip,
  //       name: domain.name,
  //       organization: domain.organization
  //     })
  //   );
  // }
  // saveDomainsToDb(domains);
  // console.log(`[censys] done, saved or updated ${domains.length} domains`);
};
