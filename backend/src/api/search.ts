import {
    IsInt,
    IsPositive,
    IsString,
    IsIn,
    ValidateNested,
    isUUID,
    IsOptional,
    IsObject,
    IsUUID
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { Domain, connectToDatabase } from '../models';
  import { validateBody, wrapHandler, NotFound } from './helpers';
  import { SelectQueryBuilder, In } from 'typeorm';
  import { isGlobalViewAdmin, getOrgMemberships } from './auth';
  import ESClient from '../tasks/es-client';
  
  
export const search = wrapHandler(async (event) => {
    if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
        return {
        statusCode: 200,
        body: JSON.stringify({
            result: [],
            count: 0
        })
        };
    }
    await connectToDatabase();
    // const search = await validateBody(DomainSearch, event.body);

    const searchBody = JSON.parse(event.body!);

    const client = new ESClient();
    // const searchResults = 
    
    let searchResults;
    try {
        searchResults = await client.searchDomains(searchBody);
    } catch (e) {
        console.error(e.meta.body.error);
        throw e;
    }

    console.error(searchResults.body);

    return {
        statusCode: 200,
        body: JSON.stringify(searchResults.body)
    }
});
