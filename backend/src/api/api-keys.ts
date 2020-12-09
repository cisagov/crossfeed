import { isUUID } from 'class-validator';
import { connectToDatabase, ApiKey } from '../models';
import { wrapHandler, NotFound } from './helpers';
import { getUserId } from './auth';
import { randomBytes, createHash } from 'crypto';

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
  const key = randomBytes(16).toString('hex');
  // Store a hash of the API key instead of the key itself
  let apiKey = await ApiKey.create({
    hashedKey: createHash('sha256').update(key).digest('hex'),
    lastFour: key.substr(-4),
    user: { id: getUserId(event) }
  });
  apiKey = await apiKey.save();
  return {
    statusCode: 200,
    body: JSON.stringify({ ...apiKey, key: key })
  };
});
