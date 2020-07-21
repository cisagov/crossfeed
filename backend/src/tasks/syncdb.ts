import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  const dangerouslyforce =
    event === 'dangerouslyforce' ||
    (event.type && event.type === 'dangerouslyforce');
  if (connection) await connection.synchronize(dangerouslyforce);
  else console.error('Error: could not sync');
};
