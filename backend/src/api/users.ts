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
  IsUUID,
  IsEnum,
  IsEmail
} from 'class-validator';
import { User, connectToDatabase, Role } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import {
  getUserId,
  canAccessUser,
  isGlobalViewAdmin,
  isOrgAdmin,
  isGlobalWriteAdmin
} from './auth';

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

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  organization: string;

  @IsBoolean()
  @IsOptional()
  organizationAdmin: string;
}

export const invite = wrapHandler(async (event) => {
  const body = await validateBody(NewUser, event.body);
  // Invoker must be either an organization or global admin
  if (body.organization) {
    if (!isOrgAdmin(event, body.organization)) return Unauthorized;
  } else {
    if (!isGlobalWriteAdmin(event)) return Unauthorized;
  }

  await connectToDatabase();

  // Check if user already exists
  let user = await User.findOne({
    email: body.email
  });

  if (!user) {
    user = await User.create({
      invitePending: true,
      ...body
    });
    await User.save(user);
  } else if (!user.firstName && !user.lastName) {
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    await User.save(user);
  }

  if (body.organization) {
    // Create approved role if organization supplied
    const role = Role.create({
      user: user,
      organization: { id: body.organization },
      approved: true,
      role: body.organizationAdmin ? 'admin' : 'user'
    });

    await role.save();
  }

  // TODO: Send invite email via SES

  const updated = await User.findOne(
    {
      id: user.id
    },
    {
      relations: ['roles', 'roles.organization']
    }
  );
  return {
    statusCode: 200,
    body: JSON.stringify(updated)
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
