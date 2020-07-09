import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsArray,
  IsBoolean
} from 'class-validator';
import { Organization, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';

export const del = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.organizationId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const result = await Organization.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const update = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.organizationId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewOrganization, event.body);
  const org = await Organization.findOne(
    {
      id
    },
    {
      relations: ['userRoles']
    }
  );
  if (org) {
    Organization.merge(org, body);
    const res = await Organization.save(org);
    return {
      statusCode: 200,
      body: JSON.stringify(org)
    };
  }
  return NotFound;
});

class NewOrganization {
  @IsString()
  name: string;

  @IsArray()
  rootDomains: string[];

  @IsArray()
  ipBlocks: string[];

  @IsBoolean()
  isPassive: boolean;

  @IsBoolean()
  inviteOnly: boolean;
}

export const create = wrapHandler(async (event) => {
  await connectToDatabase();
  const body = await validateBody(NewOrganization, event.body);
  const scan = await Organization.create(body);
  const res = await Organization.save(scan);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await Organization.find();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.organizationId;
  if (!isUUID(id)) {
    return NotFound;
  }

  const result = await Organization.findOne(id, {
    relations: ['userRoles']
  });

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});

export const listPublicNames = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await Organization.find({
    select: ['name'],
    where: {
      inviteOnly: false
    }
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
