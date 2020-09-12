import { Domain, connectToDatabase } from '../models';
import { CommandOptions } from './ecs-client';
import { Client } from '@elastic/elasticsearch';
import * as crypto from 'crypto';

const INDEX_NAME = 'webpages';

export const handler = async (commandOptions: CommandOptions) => {

  console.log('Running searchSync');
  await connectToDatabase();
  const domains = await Domain.find({
      
  });

  const client = new Client({ node: process.env.ELASTICSEARCH_ENDPOINT! });

  await client.helpers.bulk<Domain>({
    datasource: domains,
    onDocument(domain) {
      return [
        {
          update: {
            _index: 'domains',
            _id: domain.id
          }
        },
        { doc_as_upsert: true }
      ];
    }
  });
  /**
backend_1   | {
backend_1   |   took: 34,
backend_1   |   errors: false,
backend_1   |   items: [
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] }
backend_1   |   ]
backend_1   | }
     */
};
