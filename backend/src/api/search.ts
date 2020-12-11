import { validateBody, wrapHandler } from './helpers';
import { getOrgMemberships, isGlobalViewAdmin } from './auth';
import { buildRequest } from './search/buildRequest';
import ESClient from '../tasks/es-client';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  organizationId?: string;
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
  let options;
  if (
    searchBody.organizationId &&
    (getOrgMemberships(event).includes(searchBody.organizationId) ||
      isGlobalViewAdmin(event))
  ) {
    //Search for a specific organization
    options = {
      organizationIds: [searchBody.organizationId],
      matchAllOrganizations: false
    };
  } else {
    options = {
      organizationIds: getOrgMemberships(event),
      matchAllOrganizations: isGlobalViewAdmin(event)
    };
  }
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
