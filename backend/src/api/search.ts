import { connectToDatabase } from '../models';
import { Unauthorized, validateBody, wrapHandler } from './helpers';
import { getOrgMemberships, isGlobalWriteAdmin } from './auth';
import { buildRequest } from './search/buildRequest';
import ESClient from '../tasks/es-client';
import { IsArray, IsInt, IsObject, IsString } from 'class-validator';
class SearchBody {
  @IsInt()
  current: number;

  @IsInt()
  resultsPerPage: number;

  @IsString()
  searchTerm: string;

  @IsString()
  sortDirection: string;

  @IsString()
  sortField: string;

  @IsArray()
  filters: { field: string; values: any[]; type: string }[];
}

/**
 * @swagger
 *
 * /search:
 *  post:
 *    description: Perform a search on all assets using Elasticsearch.
 *    tags:
 *    - Search
 */
export const search = wrapHandler(async (event) => {
  const searchBody = await validateBody(SearchBody, event.body);
  const options = {
    organizationIds: getOrgMemberships(event),
    matchAllOrganizations: isGlobalWriteAdmin(event)
  };
  const request = buildRequest(searchBody, options);

  const client = new ESClient();
  let searchResults;
  try {
    searchResults = await client.searchDomains(request);
  } catch (e) {
    console.error(e.meta.body.error);
    throw e;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(searchResults.body)
  };
});
