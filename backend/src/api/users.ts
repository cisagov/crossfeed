import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsArray,
  IsBoolean,
  IsOptional
} from 'class-validator';
import { User, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';

export const del = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const result = await User.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const update = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewUser, event.body);
  const user = await User.findOne({
    id: id
  });
  if (user) {
    user.firstName = body.firstName ?? user.firstName;
    user.lastName = body.lastName ?? user.lastName;
    user.fullName = user.firstName + ' ' + user.lastName;
    await User.save(user);
    return {
      statusCode: 200,
      body: JSON.stringify(user)
    };
  }
  return NotFound;
});

class NewUser {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  email: string;
}

export const invite = wrapHandler(async (event) => {
  await connectToDatabase();
  const body = await validateBody(NewUser, event.body);
  const scan = await User.create({
    invitePending: true,
    ...body
  });
  const res = await User.save(scan);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

export const me = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await User.find();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await User.find();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
