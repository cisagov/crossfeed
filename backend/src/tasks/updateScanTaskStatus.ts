import { Handler } from 'aws-lambda';
import { connectToDatabase, User } from '../models';

export const handler: Handler = async (event) => {
  console.error(event);
};
