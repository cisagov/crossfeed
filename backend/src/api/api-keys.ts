import { isUUID } from 'class-validator';
import { connectToDatabase, ApiKey } from '../models';
import { wrapHandler, NotFound } from './helpers';
import { getUserId } from './auth';
import { randomBytes } from 'crypto';

export const del = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.keyId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const key = await ApiKey.findOne({
    id,
    user: { id: getUserId(event) }
  });
  if (key) {
    const result = await ApiKey.delete({
      id,
      user: { id: getUserId(event) }
    });
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }
  return NotFound;
});

export const generate = wrapHandler(async (event) => {
  await connectToDatabase();
  const key = await ApiKey.create({
    createdAt: new Date(),
    key: randomBytes(16).toString('hex'),
    user: { id: getUserId(event) }
  });
  key.save();
  return {
    statusCode: 200,
    body: JSON.stringify(key)
  };
});
