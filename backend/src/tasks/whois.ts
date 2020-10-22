import {
  Vulnerability
} from '../models';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import PQueue from 'p-queue';
import * as whois from 'whois';
import getRootDomains from './helpers/getRootDomains';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { differenceInDays } from 'date-fns';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId } = commandOptions;

  if (!organizationId) {
    throw new Error("organizationId must be defined");
  }

  const rootDomains = await getRootDomains(organizationId);

  const queue = new PQueue({ concurrency: 2 });
  const vulns: Vulnerability[] = [];
  rootDomains.forEach(domain => queue.add(async () => {
    const result: string = await new Promise((resolve, reject) => whois.lookup(domain, (err, data) => err ? reject(err) : resolve(data)));
    const match = result.match(/Registrar Registration Expiration Date: (.*)/);
    if (!match || !match[1]) {
      return;
    }
    if (differenceInDays(new Date(match[1]), new Date(Date.now())) <= 31) {
      // one month
      vulns.push(plainToClass(Vulnerability, {
        domain: domain,
        lastSeen: new Date(Date.now()),
        title: "Registrar expiration soon - " + match[1],
        severity: 'high',
        state: 'open',
        source: 'whois_expiration'
      }));
    }
  }));
  await queue.onIdle();
  await saveVulnerabilitiesToDb(vulns, false);

  console.log(`whois done`);
};
