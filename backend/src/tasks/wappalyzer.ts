import { Domain } from '../models';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import PQueue from 'p-queue';

const wappalyze = async (domain: Domain): Promise<void> => {
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
      domain.webTechnologies = result;
      await domain.save();
    }
  } catch (e) {
    console.error(e);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running wappalyzer on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const queue = new PQueue({ concurrency: 5 });
  await Promise.all(
    liveWebsites.map((site) => queue.add(() => wappalyze(site)))
  );

  console.log(`Wappalyzer finished for ${liveWebsites.length} domains`);
};
