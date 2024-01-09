import axios from 'axios';
import { Domain } from '../models';
import { plainToClass } from 'class-transformer';
import * as dns from 'dns';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';

interface CensysAPIResponse {
  result: {
    total: number;
    hits: [
      {
        names?: string[];
      }
    ];
  };
}

const resultLimit = 1000;
const resultsPerPage = 100;

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const fetchCensysData = async (rootDomain: string) => {
  console.log(`Fetching certificates for ${rootDomain}`);
  const data = await fetchPage(rootDomain);
  console.log(
    `Censys found ${data.result.total} certificates for ${rootDomain}
    Fetching ${Math.min(data.result.total, resultLimit)} of them...`
  );
  let resultCount = 0;
  let nextToken = data.result.links.next;
  while (nextToken && resultCount < resultLimit) {
    const nextPage = await fetchPage(rootDomain, nextToken);
    data.result.hits = data.result.hits.concat(nextPage.result.hits);
    nextToken = nextPage.result.links.next;
    resultCount += resultsPerPage;
  }
  return data as CensysAPIResponse;
};

const fetchPage = async (rootDomain: string, nextToken?: string) => {
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
      per_page: resultsPerPage,
      cursor: nextToken,
      fields: ['names']
    }
  });
  return data;
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log(`Running Censys on: ${organizationName}`);

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
      if (!hit.names) continue;
      for (const name of hit.names) {
        const normalizedName = name.replace(/\*\.|^(www\.)/g, ''); // Remove www from beginning of name and wildcards from entire name
        if (
          normalizedName.endsWith(rootDomain) &&
          !uniqueNames.has(normalizedName)
        ) {
          uniqueNames.add(normalizedName);
          foundDomains.add({
            name: normalizedName,
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
  console.log(`Saving ${organizationName} subdomains to database...`);
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
  console.log(
    `Censys saved or updated ${domains.length} subdomains for ${organizationName}`
  );
};
