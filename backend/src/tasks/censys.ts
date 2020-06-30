import { Handler } from 'aws-lambda';
import axios from 'axios';
import { connectToDatabase, Domain, Organization } from '../models';
import { saveDomainToDb } from './helpers';
import { plainToClass } from 'class-transformer';

interface CensysAPIResponse {
  status: string;
  results: {
    'parsed.names': string[];
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

const fetchCensysData = async (rootDomain, page) => {
  console.log(
    `[censys] fetching certificates for query "${rootDomain}", page ${page}`
  );
  const { data, status } = await axios({
    url: 'https://censys.io/api/v1/search/certificates',
    method: 'POST',
    auth: {
      username: String(process.env.CE_API_ID),
      password: String(process.env.CE_API_SECRET)
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
  console.log(`[censys] status code ${status}`);
  return data as CensysAPIResponse;
};

export const handler: Handler = async () => {
  await connectToDatabase();
  const organizations = await Organization.find();
  const allDomains = new Set<string>();
  const foundDomains = new Set<string>();

  for (const org of organizations) {
    for (const domain of org.rootDomains) allDomains.add(domain);
  }

  for (const rootDomain of allDomains) {
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const data = await fetchCensysData(rootDomain, page);
      pages = data.metadata.pages;
      for (const result of data.results) {
        const names = result['parsed.names'];
        for (const name of names) foundDomains.add(name);
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
    await saveDomainToDb(
      plainToClass(Domain, {
        ip: null, // Can resolve these later
        name: domain,
        asn: null
      })
    );
  }
  console.log(`[censys] done, saved or updated ${foundDomains.size} domains`);
};
