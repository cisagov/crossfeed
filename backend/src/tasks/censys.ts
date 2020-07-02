import { Handler } from 'aws-lambda';
import axios from 'axios';
import { connectToDatabase, Domain, Organization } from '../models';
import { saveDomainToDb, getRootDomains } from './helpers';
import { plainToClass } from 'class-transformer';
import * as dns from 'dns';

interface CensysAPIResponse {
  status: string;
  results: {
    'parsed.names'?: string[];
  }[];
  metadata: {
    count: number;
    page: number;
    pages: number;
  };
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const fetchCensysData = async (rootDomain: string, page: number) => {
  console.log(
    `[censys] fetching certificates for query "${rootDomain}", page ${page}`
  );
  const { data, status } = await axios({
    url: 'https://censys.io/api/v1/search/certificates',
    method: 'POST',
    auth: {
      username: String(process.env.CENSYS_API_ID),
      password: String(process.env.CENSYS_API_SECRET)
    },
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      query: rootDomain,
      page: page,
      fields: ['parsed.names']
    }
  });
  return data as CensysAPIResponse;
};

export const handler: Handler = async () => {
  await connectToDatabase();

  const allDomains = await getRootDomains(true);
  const foundDomains = new Set<{
    name: string;
    isPassive: boolean;
  }>();

  for (const rootDomain of allDomains) {
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const data = await fetchCensysData(rootDomain.name, page);
      pages = data.metadata.pages;
      for (const result of data.results) {
        const names = result['parsed.names'];
        if (!names) continue;
        for (const name of names) {
          if (name.endsWith(rootDomain.name)) {
            foundDomains.add({
              name: name.replace('*.', ''),
              isPassive: rootDomain.isPassive
            });
          }
        }
      }

      await sleep(1000); // Wait for rate limit
    }
  }

  // LATER: Can we just grab the cert the site is presenting, and store that?
  // Censys (probably doesn't know who's presenting it)
  // SSLyze (fetches the cert), Project Sonar (has SSL certs, but not sure how pulls domains -- from IPs)
  // Project Sonar has forward & reverse DNS for finding subdomains

  // Save domains to database
  console.log('[censys] saving domains to database...');
  for (const domain of foundDomains) {
    let ip: string | null;
    try {
      ip = (await dns.promises.lookup(domain.name)).address;
    } catch {
      // IP not found
      ip = null;
    }
    await saveDomainToDb(
      plainToClass(Domain, {
        ip: ip,
        name: domain.name,
        isPassive: domain.isPassive
      })
    );
  }
  console.log(`[censys] done, saved or updated ${foundDomains.size} domains`);
};
