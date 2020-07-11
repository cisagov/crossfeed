import { Domain } from '../models';
import { plainToClass } from 'class-transformer';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import saveDomainsToDb from './helpers/saveDomainsToDb';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running wappalyzer on organization', organizationName);

  const liveWebsites = await getLiveWebsites(true); // organizationId);
  const domains: Domain[] = [];
  for (const domain of liveWebsites) {
    const url =
      (domain.services.map((service) => service.port).includes(443)
        ? 'https://'
        : 'http://') + domain.name;
    try {
      const { data, status, headers } = await axios.get(url, {
        validateStatus: function () {
          // Never throw error on non-200 response
          return true;
        }
      });
      const result = await wappalyzer({ url, data, status, headers });
      if (result.length == 0) continue;
      domains.push(
        plainToClass(Domain, {
          name: domain.name,
          webTechnologies: result
        })
      );
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  saveDomainsToDb(domains);
  console.log(`Wappalyzer finished for ${domains.length} domains`);
};
