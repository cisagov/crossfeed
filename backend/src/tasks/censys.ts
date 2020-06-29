import { Handler } from 'aws-lambda';
import axios from 'axios';
import {
  connectToDatabase,
  Domain,
  Organization,
  Service,
  SSLInfo,
  WebInfo
} from '../models';
import * as uuid from 'uuid';
import { isNotEmpty } from 'class-validator';
import {
  saveDomainToDb,
  saveServicesToDb,
  saveSSLInfosToDb,
  saveWebInfoToDb
} from './helpers';

const joinOrNull = (value?: (string | null)[] | null) => {
  if (value) {
    return value.filter(isNotEmpty).join(',');
  }
  return null;
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// TODO Run below for each root domain of each organization
const fetchCensysData = async (rootDomain, page) => {
  console.log(
    `[censys] fetching certs for domain ${rootDomain}, page ${page}`
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
  console.log('[censys] status code: ' + status);
  return data;
};

// See saveAsset, other helpers in bitdiscovery.ts
export const handler: Handler = async (event) => {
  await connectToDatabase();
  const organizations = await Organization.find();
  const allDomains = new Set<string>();
  const foundDomains = new Set<string>();

  for (const org of organizations) {
    for (const domain of org.rootDomains) allDomains.add(domain);
    console.log('[censys] added ' + org.rootDomains);
  }

  for (const rootDomain of allDomains) {
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const { data, status } = await fetchCensysData(rootDomain, page);
      console.log('[censys] full response was: ' + String(data));
      pages = data['metadata']['pages'];
      console.log('[censys] found ' + pages + 'pages...');
      const names = data['parsed']['names'];
      console.log('[censys] found names: ' + names);
      for (const name of names) foundDomains.add(name);
      console.log('[censys] done running for page ' + page);
      await sleep(1000); // Wait for rate limit
    }

    console.log('[censys] final list of names was: ' + foundDomains);

    // TODO Can we just grab the cert the site is presenting, and store that?
    // Censys (probably doesn't know who's presenting it)
    // SSLyze (fetches the cert), Project Sonar (has SSL certs, but not sure how pulls domains -- from IPs)
    // Project Sonar has forward & reverse DNS for finding subdomains

    // TODO for Censys:
    // Censys: just create new domain records for each parsed.names
    // Don't create a domain record if it already exists (Amass, saveDomainToDB helper)
  }

  // while (offset < totalCount && offset < maxCount) {
  //   const { assets, total } = await fetchBitdisoveryData({
  //     limit,
  //     offset
  //   });
  //
  //   for (const asset of assets) {
  //     await saveAsset(asset);
  //   }
  //
  //   totalCount = total;
  //   offset += limit;
  //   console.log(
  //     `[bitdiscovery] fetched and parsed ${offset}/${total} bitdiscovery assets`
  //   );
  // }
};
