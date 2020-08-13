import { Domain } from '../models';
import { plainToClass } from 'class-transformer';
import wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as pLimit from 'p-limit';

const maxConcurrency = pLimit(500);

const wappalyze = async (domain: Domain): Promise<Domain | undefined> => {
  const ports = domain.services.map((service) => service.port);
  const url = ports.includes(443)
    ? `https://${domain.name}`
    : `http://${domain.name}`;
  try {
    const { data, status, headers } = await axios.get(url, {
      validateStatus: () => true
    });
    const result = await wappalyzer({ url, data, status, headers });
    if (result.length > 0) {
      return plainToClass(Domain, {
        name: domain.name,
        webTechnologies: result
      });
    }
  } catch (e) {
    console.error(e);
  }
};

const filterEmpty = <T>(value: T | undefined | null): value is T => {
  return value !== null && value !== undefined;
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running wappalyzer on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const wappalyzeResults: (Domain | undefined)[] = await Promise.all(
    liveWebsites.map(site => maxConcurrency(() => wappalyze(site)))
  );
  const domains: Domain[] = wappalyzeResults.filter(filterEmpty);

  await saveDomainsToDb(domains);
  console.log(`Wappalyzer finished for ${domains.length} domains`);
};
