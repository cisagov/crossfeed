import { connectToDatabase, Domain, Scan, Service } from '../models';
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
import getScanOrganizations from './helpers/getScanOrganizations';
import sanitizeChunkValues from './helpers/sanitizeChunkValues';

export interface IpToDomainsMap {
  [ip: string]: Domain[];
}

const auth = {
  username: process.env.CENSYS_API_ID!,
  password: process.env.CENSYS_API_SECRET!
};

const CENSYS_IPV4_ENDPOINT = 'https://censys.io/api/v1/data/ipv4_2018';

// Sometimes, a field might contain null characters, but we can't store null
// characters in a string field in PostgreSQL. For example, a site might have
// a banner ending with "</body>\r\n</html>\u0000" or "\\u0000".
export const sanitizeStringField = (input) =>
  input.replace(/\\u0000/g, '').replace(/\0/g, '');

const downloadPath = async (
  path: string,
  ipToDomainsMap: IpToDomainsMap,
  i: number,
  numFiles: number,
  commandOptions: CommandOptions
): Promise<void> => {
  if (i >= 100) {
    throw new Error('Invalid chunk number.');
  }
  console.log(`i: ${i} of ${numFiles}: starting download of url ${path}`);

  const domains: Domain[] = [];
  const services: Service[] = [];
  const gunzip = zlib.createGunzip();
  const downloadStream = got.stream.get(path, { ...auth });
  const unzippedStream = downloadStream.pipe(gunzip);
  // readInterface lets us stream the JSON file line-by-line
  const readInterface = readline.createInterface({
    input: unzippedStream
  });
  await new Promise((resolve, reject) => {
    downloadStream.on('error', reject);
    readInterface.on('line', function (line) {
      const item: CensysIpv4Data = JSON.parse(line);

      let matchingDomains = ipToDomainsMap[item.ip!] || [];
      if (process.env.IS_LOCAL && typeof jest === 'undefined') {
        // For local development: just randomly match domains
        // (this behavior is not present when running tests
        // through jest, though).
        // eslint-disable-next-line prefer-spread
        matchingDomains = [].concat
          .apply([], Object.values(ipToDomainsMap)) // get a list of all domains in the domain map
          .filter(() => Math.random() < 0.00001);
      }
      for (const matchingDomain of matchingDomains) {
        domains.push(
          plainToClass(Domain, {
            name: matchingDomain.name,
            organization: matchingDomain.organization,
            asn: item.autonomous_system?.asn,
            ip: item.ip,
            country: item.location?.country_code
          })
        );
        for (const key in item) {
          if (key.startsWith('p') && mapping[key]) {
            const service = Object.keys(item[key] as any)[0];
            const s = {
              ...mapping[key](item[key]),
              service,
              discoveredBy: { id: commandOptions.scanId },
              port: Number(key.slice(1)),
              domain: matchingDomain,
              lastSeen: new Date(Date.now()),
              serviceSource: 'censysIpv4',
              censysIpv4Results: JSON.parse(
                sanitizeStringField(JSON.stringify(item[key]))
              )
            };
            for (const k in s) {
              if (typeof s[k] === 'string') {
                s[k] = sanitizeStringField(s[k]);
              }
            }
            services.push(plainToClass(Service, s));
          }
        }
      }
    });
    readInterface.on('close', resolve);
    readInterface.on('SIGINT', reject);
    readInterface.on('SIGCONT', reject);
    readInterface.on('SIGTSTP', reject);
  });
  if (!domains.length) {
    console.log(
      `censysipv4 - processed file ${i} of ${numFiles}: got no results`
    );
  } else {
    console.log(
      `censysipv4 - processed file ${i} of ${numFiles}: got some results: ${domains.length} domains and ${services.length} services`
    );
  }

  await saveDomainsToDb(domains);
  await saveServicesToDb(services);
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId } = commandOptions;

  const { chunkNumber, numChunks } = await sanitizeChunkValues(commandOptions);

  const {
    data: { results }
  } = await axios.get(CENSYS_IPV4_ENDPOINT, { auth });

  const {
    data: { files }
  } = await axios.get(results.latest.details_url, { auth });

  await connectToDatabase();
  const scan = await Scan.findOne(
    { id: commandOptions.scanId },
    { relations: ['organizations', 'tags', 'tags.organizations'] }
  );

  let orgs: string[] | undefined = undefined;
  // censysIpv4 is a global scan, so organizationId is only specified for tests.
  // Otherwise, scan.organizations can be used for granular control of censysIpv4.
  if (organizationId) orgs = [organizationId];
  else if (scan?.isGranular) {
    orgs = getScanOrganizations(scan).map((org) => org.id);
  }

  const allDomains = await getAllDomains(orgs);

  const queue = new PQueue({ concurrency: 2 });

  const numFiles = Object.keys(files).length;
  const fileNames = Object.keys(files).sort();
  const jobs: Promise<void>[] = [];

  let startIndex = Math.floor(((1.0 * chunkNumber!) / numChunks!) * numFiles);
  let endIndex =
    Math.floor(((1.0 * (chunkNumber! + 1)) / numChunks!) * numFiles) - 1;

  if (process.env.IS_LOCAL && typeof jest === 'undefined') {
    // For local testing.
    startIndex = 0;
    endIndex = 1;
  }

  const ipToDomainsMap: IpToDomainsMap = allDomains.reduce<IpToDomainsMap>(
    (map: IpToDomainsMap, domain: Domain) => {
      if (!map[domain.ip]) {
        map[domain.ip] = [];
      }
      map[domain.ip].push(domain);
      return map;
    },
    {}
  );

  for (let i = startIndex; i <= endIndex; i++) {
    const idx = i;
    const fileName = fileNames[idx];
    jobs.push(
      queue.add(() =>
        pRetry(
          () =>
            downloadPath(
              files[fileName].download_path,
              ipToDomainsMap,
              idx,
              numFiles,
              commandOptions
            ),
          {
            // Perform fewer retries on jest to make tests faster
            retries: typeof jest === 'undefined' ? 5 : 2,
            randomize: true
          }
        )
      )
    );
  }
  console.log(`censysipv4: scheduled all tasks`);
  await Promise.all(jobs);

  console.log(`censysipv4 done`);
};
