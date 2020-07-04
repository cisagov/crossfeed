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
  const org = await Organization.findOne({
    id: id
  });
  if (org) {
    Organization.merge(org, body);
    const res = await Organization.save(org);
    return {
      statusCode: 200,
      body: JSON.stringify(res)
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
