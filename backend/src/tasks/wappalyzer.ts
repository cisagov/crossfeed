import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain, Service, WebInfo } from '../models';
import { saveServicesToDb, saveWebInfoToDb, getLiveWebsites } from './helpers';
import { plainToClass } from 'class-transformer';
import { Like } from 'typeorm';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { length } from 'class-validator';
import { catchClause } from '@babel/types';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const domains = await getLiveWebsites();
  const services: Service[] = [];
  let count = 0;
  for (const domain of domains) {
    const url =
      (domain.ports.includes('443') ? 'https://' : 'http://') + domain.name;
    try {
      const { data, status, headers } = await axios.get(url, {
        validateStatus: function () {
          // Never throw error on non-200 response
          return true;
        }
      });
      const result = await wappalyzer({ url, data, status, headers });
      if (result.length == 0) continue;
      await saveWebInfoToDb(
        plainToClass(WebInfo, {
          domain: domain,
          technologies: result
        })
      );
      count++;
    } catch (e) {
      continue;
    }
  }

  console.log(`Wappalyzer updated for ${count} new services`);
};
