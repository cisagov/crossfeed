// This is a temporary proof-of-concept port scanner that actively scans ports.
// We'll want to replace this with the Project Sonar passive port scanner.

import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain, Service } from '../models';
import { saveServicesToDb } from './helpers';
import { plainToClass } from 'class-transformer';
import { Like, IsNull, Not } from 'typeorm';
import * as portscanner from 'portscanner';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const domains = await Domain.find({
    reverseName: Like('gov.cisa%'),
    ip: Not(IsNull()),
    isPassive: false
  });
  const services: Service[] = [];
  for (const domain of domains) {
    for (const port of [21, 22, 80, 443, 3000, 8080, 8443]) {
      const status = await portscanner.checkPortStatus(port, domain.ip);
      if (status === 'open') {
        services.push(
          plainToClass(Service, {
            domain: domain,
            port: port,
            lastSeen: new Date()
          })
        );
      }
    }
  }

  await saveServicesToDb(services);

  console.log(`Portscan finished for ${services.length} services`);
};
