import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID
} from 'class-validator';
import { User, connectToDatabase, Role } from '../../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from '../helpers';
import { getUserId, canAccessUser, isGlobalViewAdmin } from './auth';

export const del = wrapHandler(async (event) => {
  if (!canAccessUser(event, event.pathParameters?.userId)) return Unauthorized;
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
  if (!canAccessUser(event, event.pathParameters?.userId)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewUser, event.body);
  const user = await User.findOne(
    {
      id: id
    },
    {
      relations: ['roles', 'roles.organization']
    }
  );
  if (user) {
    user.firstName = body.firstName ?? user.firstName;
    user.lastName = body.lastName ?? user.lastName;
    user.fullName = user.firstName + ' ' + user.lastName;
    await User.save(user);

    if (body.organization) {
      // Create pending role if organization supplied
      await Role.insert({
        user: user,
        organization: { id: body.organization },
        approved: false,
        role: 'user'
      });
    }
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

  @IsUUID()
  @IsOptional()
  organization: string;
}

export const invite = wrapHandler(async (event) => {
  // TODO: associate this with an organization
  const body = await validateBody(NewUser, event.body);
  await connectToDatabase();
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
  const result = await User.findOne(getUserId(event), {
    relations: ['roles', 'roles.organization']
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const result = await User.find({
    relations: ['roles', 'roles.organization']
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
