import { connectToDatabase, Domain, Scan } from '../models';
import { plainToClass } from 'class-transformer';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { CommandOptions } from './ecs-client';
import { CensysCertificatesData } from '../models/generated/censysCertificates';
import getAllDomains from './helpers/getAllDomains';
import sanitizeChunkValues from './helpers/sanitizeChunkValues';
import * as zlib from 'zlib';
import * as readline from 'readline';
import got from 'got';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import axios from 'axios';
import getScanOrganizations from './helpers/getScanOrganizations';

interface CommonNameToDomainsMap {
  [commonName: string]: Domain[];
}

const auth = {
  username: process.env.CENSYS_API_ID!,
  password: process.env.CENSYS_API_SECRET!
};

const CENSYS_CERTIFICATES_ENDPOINT =
  'https://censys.io/api/v1/data/certificates_2018/';

// Sometimes, a field might contain null characters, but we can't store null
// characters in a string field in PostgreSQL. For example, a site might have
// a banner ending with "</body>\r\n</html>\u0000" or "\\u0000".
const sanitizeStringField = (input) =>
  input.replace(/\\u0000/g, '').replace(/\0/g, '');

const downloadPath = async (
  path: string,
  commonNameToDomainsMap: CommonNameToDomainsMap,
  i: number,
  numFiles: number
): Promise<void> => {
  if (i >= 100) {
    throw new Error('Invalid chunk number.');
  }
  console.log(`i: ${i} of ${numFiles}: starting download of url ${path}`);

  const domains: Domain[] = [];
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
      const item: CensysCertificatesData = JSON.parse(line);

      // eslint-disable-next-line prefer-spread
      let matchingDomains = [].concat
        .apply(
          [],
          ((item.parsed?.names as any as string[]) || []).map(
            (name) => commonNameToDomainsMap[name]
          )
        )
        .filter((e) => e);

      if (process.env.IS_LOCAL && typeof jest === 'undefined') {
        // For local development: just randomly match domains
        // (this behavior is not present when running tests
        // through jest, though).
        // eslint-disable-next-line prefer-spread
        matchingDomains = [].concat
          .apply([], Object.values(commonNameToDomainsMap)) // get a list of all domains in the domain map
          .filter(() => Math.random() < 0.00001);
      }
      for (const matchingDomain of matchingDomains) {
        domains.push(
          plainToClass(Domain, {
            name: matchingDomain.name,
            organization: matchingDomain.organization,
            censysCertificatesResults: JSON.parse(
              sanitizeStringField(JSON.stringify(item))
            ),
            ssl: {
              issuerOrg: item.parsed?.issuer?.organization,
              issuerCN: item.parsed?.issuer?.common_name,
              validFrom: item.parsed?.validity?.start,
              validTo: item.parsed?.validity?.end,
              altNames: item.parsed?.names || [],
              fingerprint: item.raw
            }
          })
        );
      }
    });
    readInterface.on('close', resolve);
    readInterface.on('SIGINT', reject);
    readInterface.on('SIGCONT', reject);
    readInterface.on('SIGTSTP', reject);
  });
  if (!domains.length) {
    console.log(
      `censysCertificates - processed file ${i} of ${numFiles}: got no results`
    );
  } else {
    console.log(
      `censysCertificates - processed file ${i} of ${numFiles}: got some results: ${domains.length} domains`
    );
  }

  await saveDomainsToDb(domains);
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId } = commandOptions;

  const { chunkNumber, numChunks } = await sanitizeChunkValues(commandOptions);

  const {
    data: { results }
  } = await pRetry(() => axios.get(CENSYS_CERTIFICATES_ENDPOINT, { auth }), {
    // Perform fewer retries on jest to make tests faster
    retries: typeof jest === 'undefined' ? 5 : 2,
    randomize: true
  });

  const {
    data: { files }
  } = await pRetry(() => axios.get(results.latest.details_url, { auth }), {
    // Perform fewer retries on jest to make tests faster
    retries: typeof jest === 'undefined' ? 5 : 2,
    randomize: true
  });

  await connectToDatabase();
  const scan = await Scan.findOne(
    { id: commandOptions.scanId },
    { relations: ['organizations', 'tags', 'tags.organizations'] }
  );

  let orgs: string[] | undefined = undefined;
  // censysCertificates is a global scan, so organizationId is only specified for tests.
  // Otherwise, scan.organizations can be used for granular control of censys.
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

  const commonNameToDomainsMap: CommonNameToDomainsMap =
    allDomains.reduce<CommonNameToDomainsMap>(
      (map: CommonNameToDomainsMap, domain: Domain) => {
        const split = domain.name.split('.');
        for (let i = 0; i < split.length - 1; i++) {
          const commonName =
            i === 0 ? domain.name : '*.' + split.slice(i).join('.');
          if (!map[commonName]) {
            map[commonName] = [];
          }
          map[commonName].push(domain);
        }
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
              commonNameToDomainsMap,
              idx,
              numFiles
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
  console.log(`censysCertificates: scheduled all tasks`);
  await Promise.all(jobs);

  console.log(`censysCertificates done`);
};
