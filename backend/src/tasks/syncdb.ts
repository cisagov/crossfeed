import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';
import ESClient from './es-client';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  const dangerouslyforce =
    event === 'dangerouslyforce' ||
    (event.type && event.type === 'dangerouslyforce');
  if (connection) await connection.synchronize(dangerouslyforce);
  else console.error('Error: could not sync');

  if (process.env.NODE_ENV !== 'test') {
    // Create indices on elasticsearch only when not using tests.
    const client = new ESClient();
    await client.syncDomainsIndex();
  }
};
