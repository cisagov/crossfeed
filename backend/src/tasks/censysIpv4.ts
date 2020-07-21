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
import * as https from 'https';
import * as readline from 'readline';

const auth = {
  username: process.env.CENSYS_API_ID!,
  password: process.env.CENSYS_API_SECRET!
};
const CENSYS_IPV4_ENDPOINT = 'https://censys.io/api/v1/data/ipv4_2018/';

// schema: https://censys.io/help/bigquery/ipv4

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  const {
    data: { results }
  } = await axios.get(CENSYS_IPV4_ENDPOINT, { auth });

  const {
    data: { files }
  } = await axios.get(results.latest.details_url, { auth });

  const allDomains = await getAllDomains();

  const domains: Domain[] = [];
  const services: Service[] = [];

  for (const fileName in files) {
    console.log('Downloading file', files[fileName].download_path);
    const gunzip = zlib.createGunzip();
    await new Promise((resolve, reject) =>
      https.get(
        files[fileName].download_path,
        {
          auth: `${auth.username}:${auth.password}`
        },
        (res) => {
          const unzipped = res.pipe(gunzip);
          const readInterface = readline.createInterface({
            input: unzipped
          });
          // readInterface lets us stream the JSON file line-by-line
          readInterface.on('line', function (line) {
            const item: CensysIpv4Data = JSON.parse(line);
            const matchingDomains = allDomains.filter((e) => e.ip === item.ip);
            for (const matchingDomain of matchingDomains) {
              console.log('Got matching domain ', matchingDomain.name);
              domains.push(
                plainToClass(Domain, {
                  name: matchingDomain.name,
                  asn: item.autonomous_system?.asn,
                  ip: item.ip,
                  country: item.location?.country_code,
                  lastSeen: new Date(Date.now())
                })
              );
              for (const key in item) {
                if (key.startsWith('p') && mapping[key]) {
                  const service = Object.keys(item[key] as any)[0];
                  services.push(
                    plainToClass(Service, {
                      ...mapping[key](item[key]),
                      service,
                      port: Number(key.slice(1)),
                      domain: matchingDomain
                    })
                  );
                }
              }
            }
          });
          readInterface.on('close', resolve);
          readInterface.on('SIGINT', reject);
          readInterface.on('SIGCONT', reject);
          readInterface.on('SIGTSTP', reject);
        }
      )
    );
    saveDomainsToDb(domains);
    saveServicesToDb(services);
  }

  // console.log(`[censys] done, saved or updated ${domains.length} domains`);
};
