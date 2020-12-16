import { IsEnum, IsInt, IsPositive, IsString, isUUID } from 'class-validator';
import { connectToDatabase, Alert, AlertType } from '../models';
import { wrapHandler, NotFound, validateBody } from './helpers';
import { getUserId } from './auth';
import { randomBytes, createHash } from 'crypto';

/**
 * @swagger
 *
 * /alerts/{id}:
 *  delete:
 *    description: Delete a particular alert.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Alert id
 *    tags:
 *    - Alerts
 */
export const del = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.alertId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const alert = await Alert.findOne({
    id,
    user: { id: getUserId(event) }
  });
  if (alert) {
    const result = await Alert.delete({
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

class NewAlert {
  @IsString()
  @IsEnum(AlertType)
  type: AlertType;

  @IsInt()
  @IsPositive()
  frequency: number = 1;
}

/**
 * @swagger
 *
 * /alerts:
 *  post:
 *    description: Create a new alert.
 *    tags:
 *    - Alerts
 */
export const create = wrapHandler(async (event) => {
  await connectToDatabase();
  const body = await validateBody(NewAlert, event.body);
  const alert = await Alert.create({
    ...body,
    user: { id: getUserId(event) },
    nextNotifiedAt: new Date(Date.now())
  }).save();
  return {
    statusCode: 200,
    body: JSON.stringify(alert)
  };
});
