import axios from 'axios';
import { Domain, Service } from '../models';
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

const auth = {
  username: process.env.CENSYS_API_ID!,
  password: process.env.CENSYS_API_SECRET!
};
const CENSYS_IPV4_ENDPOINT = 'https://censys.io/api/v1/data/ipv4_2018/';

const downloadPath = async (path, allDomains, i, numFiles): Promise<void> => {
  console.log(`i: ${i} of ${numFiles}: starting download of url ${path}`);

  const domains: Domain[] = [];
  const services: Service[] = [];
  const gunzip = zlib.createGunzip();
  // TODO: use stream.pipeline instead, since .pipe doesn't forward errors.
  const unzipped = got.stream.get(path, { ...auth }).pipe(gunzip);
  // readInterface lets us stream the JSON file line-by-line
  const readInterface = readline.createInterface({
    input: unzipped
  });
  await new Promise((resolve, reject) => {
    readInterface.on('line', function (line) {
      const item: CensysIpv4Data = JSON.parse(line);
      // For local testing: just match the first entry.
      const matchingDomains = process.env.IS_LOCAL
        ? allDomains.filter((e, i) => Math.random() < 0.0001)
        : allDomains.filter((e) => e.ip === item.ip);
      for (const matchingDomain of matchingDomains) {
        domains.push(
          plainToClass(Domain, {
            name: matchingDomain.name,
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
              port: Number(key.slice(1)),
              domain: matchingDomain,
              lastSeen: new Date(Date.now())
            };
            for (let k in s) {
              // Sometimes, a field might contain null characters, but we can't store null
              // characters in a string field in PostgreSQL. For example, a site might have
              // a banner ending with "</body>\r\n</html>\u0000".
              // TODO(Ashwin): add a test for this.
              if (typeof s[k] === 'string') {
                s[k] = s[k].replace(/\0/g, '');
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
  console.log(
    `i: ${i} of ${numFiles}: got ${domains.length} domains and ${services.length} services`
  );

  await saveDomainsToDb(domains);
  await saveServicesToDb(services);
};

export const handler = async (commandOptions: CommandOptions) => {
  const { chunkNumber, numChunks } = commandOptions;

  if (chunkNumber === undefined || numChunks === undefined) {
    throw new Error('Chunks not specified.');
  }

  const {
    data: { results }
  } = await axios.get(CENSYS_IPV4_ENDPOINT, { auth });

  const {
    data: { files }
  } = await axios.get(results.latest.details_url, { auth });

  const allDomains = await getAllDomains();

  const queue = new PQueue({ concurrency: 5 });

  const numFiles = Object.keys(files).length;
  const fileNames = Object.keys(files).sort();
  const jobs: Promise<void>[] = [];

  let startIndex = Math.floor(((1.0 * chunkNumber) / numChunks) * numFiles);
  let endIndex =
    Math.floor(((1.0 * (chunkNumber + 1)) / numChunks) * numFiles) - 1;

  if (process.env.IS_LOCAL) {
    // For local testing.
    startIndex = 0;
    endIndex = 1;
  }

  for (let i = startIndex; i <= endIndex; i++) {
    const idx = i;
    const fileName = fileNames[idx];
    jobs.push(
      queue.add(() =>
        downloadPath(files[fileName].download_path, allDomains, idx, numFiles)
      )
    );
  }
  console.log(`censysipv4: scheduled all tasks`);
  await Promise.all(jobs);

  console.log(`censysipv4 done`);
};
