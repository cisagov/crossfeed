import { Handler } from 'aws-lambda';
import { connectToDatabase, User } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  const res = await connection.query(event.query);
  console.log(res);
};
