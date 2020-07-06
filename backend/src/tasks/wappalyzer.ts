import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain } from '../models';
import { getLiveWebsites, saveDomainToDb } from './helpers';
import { plainToClass } from 'class-transformer';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const domains = await getLiveWebsites(false);
  for (const domain of domains) {
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
      await saveDomainToDb(
        plainToClass(Domain, {
          name: domain.name,
          webTechnologies: result
        })
      );
    } catch (e) {
      continue;
    }
  }

  console.log(`Wappalyzer finished for ${domains.length} domains`);
};
