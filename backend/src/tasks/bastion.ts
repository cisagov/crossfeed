import { Handler } from 'aws-lambda';
import { connectToDatabase, User } from '../models';
import ESClient from '../tasks/es-client';
import logger from '../tools/lambda-logger';

export const handler: Handler = async (event, context) => {
  if (event.mode === 'db') {
    const connection = await connectToDatabase();
    const res = await connection.query(event.query);
    logger.info(res, { context });
  } else if (event.mode === 'es') {
    if (event.query === 'delete') {
      const client = new ESClient();
      await client.deleteAll();
      logger.info('Index successfully deleted', { context });
    } else {
      logger.info(`Query not found: ${event.query}`, { context });
    }
  } else {
    logger.info(`Mode not found: ${event.mode}`, { context });
  }
};
