import {
    connectToDatabase,
    Domain,
    Organization,
    Scan,
    Service
  } from '../models';
  import { plainToClass } from 'class-transformer';
  import saveDomainsToDb from './helpers/saveDomainsToDb';
  import { CommandOptions } from './ecs-client';
  import { CensysIpv4Data } from 'src/models/generated/censysIpv4';
  import { mapping } from './censys/mapping';
  import saveServicesToDb from './helpers/saveServicesToDb';
  import getAllDomains from './helpers/getAllDomains';
  import * as zlib from 'zlib';
  import * as readline from 'readline';
  import got from 'got';
  import PQueue from 'p-queue';
  import pRetry from 'p-retry';
  import axios from 'axios';
  import * as whois from 'whois';
  
  export const handler = async (commandOptions: CommandOptions) => {
    const { organizationId } = commandOptions;

    if (!organizationId) {
        throw new Error("organizationId must be defined");
    }
  
    const allDomains = await getAllDomains([organizationId]);
  
    const queue = new PQueue({ concurrency: 2 });
    const jobs: Promise<Domain>[] = allDomains.map(domain => queue.add(() => {
        return plainToClass(Domain, {
              name: domain.name,
              organization: domain.organization,
              
            })
        }));


    await saveDomainsToDb(domains);

    await queue.onEmpty();
    console.log(`censysipv4: scheduled all tasks`);
    await Promise.all(jobs);
  
    console.log(`censysipv4 done`);
  };
  