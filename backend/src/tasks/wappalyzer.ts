import axios from 'axios';
import { CommandOptions } from './ecs-client';
import { getLiveWebsites, LiveDomain } from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import { wappalyzer } from './helpers/simple-wappalyzer';

const wappalyze = async (domain: LiveDomain): Promise<void> => {
  try {
    const { data, status, headers } = await axios.get(domain.url, {
      validateStatus: () => true
    });
    const result = await wappalyzer({ url: domain.url, data, headers });
    if (result.length > 0) {
      domain.service.wappalyzerResults = result;
      await domain.service.save();
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
