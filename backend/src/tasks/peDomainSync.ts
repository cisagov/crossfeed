import { plainToClass } from 'class-transformer';
import getRootDomains from './helpers/getRootDomains';
import { Domain}  from '../models';
import { CommandOptions } from './ecs-client';
import saveDomainsToDb from './helpers/saveDomainsToDb';

export const handler = async (commandOptions: CommandOptions) => {
    const { organizationId, organizationName} = commandOptions;
    console.log('Adding organization', organizationName);

    const rootDomains = await getRootDomains(organizationId!);

    const domains: Domain[] = [];
    for (const rootDomain of rootDomains) {
        console.log(rootDomain);
        domains.push(
            plainToClass(Domain, {
              name: rootDomain,
              organization: { id: organizationId },
            })
        );
    }
    await saveDomainsToDb(domains);
    console.log(`Scan created/updated ${domains.length} new domains`);
};