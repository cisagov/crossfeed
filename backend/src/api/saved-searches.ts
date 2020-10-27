import { IsString, isUUID, IsObject } from 'class-validator';
import { connectToDatabase, SavedSearch } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import {
  isOrgAdmin,
  isGlobalWriteAdmin,
  getOrgMemberships,
  isGlobalViewAdmin
} from './auth';
import { In } from 'typeorm';

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
  searchTerm: string;

  @IsObject()
  filters: { field: string; values: any[]; type: string }[];
}

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
  const result = await SavedSearch.find({
    where
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
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
