import { plainToClass } from 'class-transformer';
import getRootDomains from './helpers/getRootDomains';
import { Domain } from '../models';
import { CommandOptions } from './ecs-client';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as dns from 'dns';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;
  console.log('Syncing domains from', organizationName);

  const rootDomains = await getRootDomains(organizationId!);

  const domains: Domain[] = [];
  for (const rootDomain of rootDomains) {
    console.log(rootDomain);
    let ipAddress;
    try {
      ipAddress = (await dns.promises.lookup(rootDomain)).address;
    } catch (e) {
      ipAddress = null;
      continue;
    }
    domains.push(
      plainToClass(Domain, {
        name: rootDomain,
        ip: ipAddress,
        organization: { id: organizationId }
      })
    );
  }
  await saveDomainsToDb(domains);
  console.log(`Scan created/updated ${domains.length} new domains`);
};
