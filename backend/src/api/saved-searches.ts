import {
  IsString,
  isUUID,
  IsObject,
  IsArray,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { connectToDatabase, SavedSearch, Vulnerability } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import {
  isOrgAdmin,
  isGlobalWriteAdmin,
  getOrgMemberships,
  isGlobalViewAdmin
} from './auth';
import { FindManyOptions, In } from 'typeorm';

export const del = wrapHandler(async (event) => {
  const id = event.pathParameters?.searchId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  if (!isGlobalWriteAdmin(event)) return Unauthorized;

  await connectToDatabase();
  const result = await SavedSearch.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

class NewSavedSearch {
  @IsString()
  name: string;

  @IsNumber()
  count: number;

  @IsString()
  sortDirection: string;

  @IsString()
  sortField: string;

  @IsString()
  searchTerm: string;

  @IsString()
  searchPath: string;

  @IsArray()
  filters: { field: string; values: any[]; type: string }[];

  @IsBoolean()
  createVulnerabilities: boolean;

  @IsObject()
  vulnerabilityTemplate: Partial<Vulnerability>;
}

const PAGE_SIZE = 20;

export const update = wrapHandler(async (event) => {
  const id = event.pathParameters?.searchId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  const body = await validateBody(NewSavedSearch, event.body);
  await connectToDatabase();
  const search = await SavedSearch.findOne(
    {
      id
    },
    {
      relations: []
    }
  );
  if (search) {
    SavedSearch.merge(search, body);
    await SavedSearch.save(search);
    return {
      statusCode: 200,
      body: JSON.stringify(search)
    };
  }
  return NotFound;
});

export const create = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  const body = await validateBody(NewSavedSearch, event.body);
  await connectToDatabase();
  const search = await SavedSearch.create({
    ...body,
    createdBy: { id: event.requestContext.authorizer!.id }
  });
  const res = await SavedSearch.save(search);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
  await connectToDatabase();
  let where = {};
  if (isGlobalViewAdmin(event)) {
    where = {};
  } else {
    where = { id: In(getOrgMemberships(event)) };
  }

  const pageSize = event.pathParameters?.pageSize
    ? parseInt(event.pathParameters.pageSize)
    : PAGE_SIZE;
  const page = event.pathParameters?.page
    ? parseInt(event.pathParameters?.page)
    : 1;

  const result = await SavedSearch.findAndCount({
    where,
    take: pageSize,
    skip: pageSize * (page - 1)
  } as FindManyOptions);

  return {
    statusCode: 200,
    body: JSON.stringify({
      result: result[0],
      count: result[1]
    })
  };
});

export const get = wrapHandler(async (event) => {
  const id = event.pathParameters?.searchId;

  if (!isOrgAdmin(event, id)) return Unauthorized;

  await connectToDatabase();
  const result = await SavedSearch.findOne(id, {
    relations: []
  });

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});
