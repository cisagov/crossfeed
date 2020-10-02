// This is a temporary proof-of-concept port scanner that actively scans ports.
// We'll want to replace this with the Project Sonar passive port scanner.

import { Service } from '../models';
import { plainToClass } from 'class-transformer';
import * as portscanner from 'portscanner';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import saveServicesToDb from './helpers/saveServicesToDb';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running portscanner on organization', organizationName);

  const domainsWithIPs = await getIps(organizationId);

  const services: Service[] = [];
  for (const domain of domainsWithIPs) {
    for (const port of [21, 22, 80, 443, 3000, 8080, 8443]) {
      try {
        const status = await portscanner.checkPortStatus(port, domain.ip);
        if (status === 'open') {
          services.push(
            plainToClass(Service, {
              domain: domain,
              discoveredBy: { id: commandOptions.scanId },
              port: port,
              lastSeen: new Date(Date.now())
            })
          );
        }
      } catch (e) {
        console.error(e);
        continue;
      }
    }
  }

  await saveServicesToDb(services);

  console.log(`Portscan finished for ${services.length} services`);
};
