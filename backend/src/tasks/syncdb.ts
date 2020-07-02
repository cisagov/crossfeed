import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  if (connection) await connection.synchronize(event === 'dangerouslyforce');
  else console.error('Error: could not sync');
};
