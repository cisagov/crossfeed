import { Domain } from '../models';
import { plainToClass } from 'class-transformer';
import wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import PQueue from 'p-queue';

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
  const liveWebsites = await getLiveWebsites(organizationId!);

  const queue = new PQueue({ concurrency: 5 });

  const results: (Domain | undefined)[] = await Promise.all(
    liveWebsites.map((site) => queue.add(() => wappalyze(site)))
  );
  const domains = results.filter(filterEmpty);

  console.log('Running wappalyzer on organization', organizationName);

  // const domains = await Promise.all
  await saveDomainsToDb(domains);
  console.log(`Wappalyzer finished for ${domains.length} domains`);
};
