import { Handler } from 'aws-lambda';
import { connectToDatabase, Domain, Service, WebInfo } from '../models';
import { saveServicesToDb, saveWebInfoToDb } from './helpers';
import { plainToClass } from 'class-transformer';
import { Like } from 'typeorm';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';
import { length } from 'class-validator';
import { catchClause } from '@babel/types';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const domains = await Domain.find({
    where: { reverseName: Like('gov.cisa%') },
    relations: ['services']
  });
  const services: Service[] = [];
  let count = 0;
  for (const domain of domains) {
    const ports = domain.services.map((s) => s.port);
    if (!ports.includes('80') && !ports.includes('443')) continue; // Change this to filter at query level
    const url = (ports.includes('443') ? 'https://' : 'http://') + domain.name;
    try {
      const { data, status, headers } = await axios.get(url);
      const result = await wappalyzer({ url, data, status, headers });
      console.log(result);
      if (result.length == 0) continue;
      const frameworkString = result.map((r) => r.name).join(', '); // Figure out how to better store this, should separate based on category
      await saveWebInfoToDb(
        plainToClass(WebInfo, {
          domain: domain,
          frameworks: frameworkString
        })
      );
      count++;
    } catch {
      continue;
    }
  }

  console.log(`Wappalyzer updated for ${count} new services`);
};
