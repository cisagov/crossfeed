import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  await connection.synchronize(event === 'dangerouslyforce');
};
