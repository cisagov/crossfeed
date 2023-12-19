import axios from 'axios';
import { Domain } from '../models';
import { plainToClass } from 'class-transformer';
import * as dns from 'dns';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';

// TODO: code only returns first 100 results; add cursor to API call to return all results
interface CensysAPIResponse {
  status: string;
  result: {
    total: number;
    hits: [
      {
        names?: string[];
      }
    ];
  };
  // links: {
  //   next: string;
  // };
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const fetchCensysData = async (rootDomain: string) => {
  console.log(
    `[censys] fetching certificates for query "${rootDomain}" from Censys...`
  );
  const { data } = await axios({
    url: 'https://search.censys.io/api/v2/certificates/search',
    method: 'POST',
    auth: {
      username: String(process.env.CENSYS_API_ID),
      password: String(process.env.CENSYS_API_SECRET)
    },
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      q: rootDomain,
      per_page: 100,
      fields: ['names']
    }
  });
  return data as CensysAPIResponse;
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running censys on organization', organizationName);

  const rootDomains = await getRootDomains(organizationId!);
  const uniqueNames = new Set<string>(); //used to dedupe domain names
  const foundDomains = new Set<{
    name: string;
    organization: { id: string };
    fromRootDomain: string;
    discoveredBy: { id: string };
  }>();

  for (const rootDomain of rootDomains) {
    const data = await fetchCensysData(rootDomain);
    for (const hit of data.result.hits) {
      const names = hit['names'];
      if (!names) continue;
      for (const name of names) {
        if (!uniqueNames.has(name) && name.endsWith(rootDomain)) {
          uniqueNames.add(name);
          foundDomains.add({
            name: name.replace('*.', ''),
            organization: { id: organizationId! },
            fromRootDomain: rootDomain,
            discoveredBy: { id: scanId }
          });
        }
      }
    }

    await sleep(1000); // Wait for rate limit
  }

  // LATER: Can we just grab the cert the site is presenting, and store that?
  // Censys (probably doesn't know who's presenting it)
  // SSLyze (fetches the cert), Project Sonar (has SSL certs, but not sure how pulls domains -- from IPs)
  // Project Sonar has both forward & reverse DNS for finding subdomains

  // Save domains to database
  console.log('[censys] saving domains to database...');
  const domains: Domain[] = [];
  for (const domain of foundDomains) {
    let ip: string | null;
    try {
      ip = (await dns.promises.lookup(domain.name)).address;
    } catch {
      // IP not found
      ip = null;
    }
    domains.push(
      plainToClass(Domain, {
        ip: ip,
        name: domain.name,
        organization: domain.organization,
        fromRootDomain: domain.fromRootDomain,
        subdomainSource: 'censys',
        discoveredBy: domain.discoveredBy
      })
    );
  }
  await saveDomainsToDb(domains);
  console.log(`[censys] done, saved or updated ${domains.length} domains`);
};
