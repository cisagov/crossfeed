
import { CommandOptions } from './ecs-client';
import {
    Domain,
    connectToDatabase,
    Vulnerability
  } from '../models';

export const handler = async (commandOptions: CommandOptions) => {
    const { organizationId, organizationName } = commandOptions;
    console.log('Running PE Report on', organizationName)

    await connectToDatabase();
    const domains = await Domain.find({
        select: ['id', 'name', 'ip', 'organization'],
        where: organizationId
        ? { organization: { id: organizationId } }
        : undefined,
        relations: ['organization']
    });
    for (const domain of domains) {
        console.log(domain);

        const dnstwistVulns = await Vulnerability.find({
            domain: domain,
            source: "dnstwist"
        });
        for (const vuln of dnstwistVulns) {
            console.log(vuln.structuredData)
        };
        const hibpVulns = await Vulnerability.find({
            domain: domain,
            source: "hibp"
        });
        for (const vuln of hibpVulns) {
            console.log(vuln.structuredData)
        };
        // const lgVulns = await Vulnerability.find({
        //     domain: domain,
        //     source: "lookingGlass"
        // });
        // for (const vuln of lgVulns) {
        //     console.log(vuln.structuredData)
        // }
        break
    } 
}