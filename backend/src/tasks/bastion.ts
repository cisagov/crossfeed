import { Handler } from 'aws-lambda';
import { connectToDatabase, User } from '../models';
import ESClient from '../tasks/es-client';

export const handler: Handler = async (event) => {
  if (event.mode === 'db') {
    const connection = await connectToDatabase(true);
    const res = await connection.query(event.query);
    console.log(res);
  } else if (event.mode === 'es') {
    if (event.query === 'delete') {
      const client = new ESClient();
      await client.deleteAll();
      console.log('Index successfully deleted');
    } else {
      console.log('Query not found: ' + event.query);
    }
  } else {
    console.log('Mode not found: ' + event.mode);
  }
};
