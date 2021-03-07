import { validateBody, wrapHandler } from './helpers';
import {
  getOrgMemberships,
  getTagOrganizations,
  isGlobalViewAdmin
} from './auth';
import { buildRequest } from './search/buildRequest';
import ESClient from '../tasks/es-client';
import { IsArray, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { Domain } from 'domain';
import S3Client from '../tasks/s3-client';
import * as Papa from 'papaparse';

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
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  tagId?: string;
}

export const fetchAllResults = async (
  filters: Partial<SearchBody>,
  options: {
    organizationIds: string[];
    matchAllOrganizations: boolean;
  }
): Promise<Domain[]> => {
  const client = new ESClient();
  const RESULTS_PER_PAGE = 1000;
  let results: Domain[] = [];
  let current = 1;
  while (true) {
    const request = buildRequest(
      {
        ...filters,
        current,
        resultsPerPage: RESULTS_PER_PAGE
      },
      options
    );
    current += 1;
    let searchResults;
    try {
      searchResults = await client.searchDomains(request);
    } catch (e) {
      console.error(e.meta.body.error);
      continue;
    }
    if (searchResults.body.hits.hits.length === 0) break;
    results = results.concat(
      searchResults.body.hits.hits.map((res) => res._source as Domain)
    );
  }
  return results;
};

const getOptions = async (
  searchBody: SearchBody,
  event
): Promise<{
  organizationIds: string[];
  matchAllOrganizations: boolean;
}> => {
  let options;
  if (
    searchBody.organizationId &&
    (getOrgMemberships(event).includes(searchBody.organizationId) ||
      isGlobalViewAdmin(event))
  ) {
    // Search for a specific organization
    options = {
      organizationIds: [searchBody.organizationId],
      matchAllOrganizations: false
    };
  } else if (searchBody.tagId) {
    options = {
      organizationIds: await getTagOrganizations(event, searchBody.tagId),
      matchAllOrganizations: false
    };
  } else {
    options = {
      organizationIds: getOrgMemberships(event),
      matchAllOrganizations: isGlobalViewAdmin(event)
    };
  }
  return options;
};

/**
 * @swagger
 *
 * /search/export:
 *  post:
 *    description: Export a search result to a CSV file by specifying an elasticsearch query
 *    tags:
 *    - Search
 */
export const export_ = wrapHandler(async (event) => {
  const searchBody = await validateBody(SearchBody, event.body);
  const options = await getOptions(searchBody, event);
  let results: any = await fetchAllResults(searchBody, options);
  results = results.map((res) => {
    res.organization = res.organization.name;
    res.ports = res.services.map((service) => service.port).join(', ');
    const products: { [key: string]: string } = {};
    for (const service of res.services) {
      for (const product of service.products) {
        if (product.name)
          products[product.name.toLowerCase()] =
            product.name + (product.version ? ` ${product.version}` : '');
      }
    }
    res.products = Object.values(products).join(', ');
    return res;
  });
  const client = new S3Client();
  const url = await client.saveCSV(
    Papa.unparse({
      fields: [
        'name',
        'ip',
        'id',
        'ports',
        'products',
        'createdAt',
        'updatedAt',
        'organization'
      ],
      data: results
    }),
    'domains'
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      url
    })
  };
});

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
  const options = await getOptions(searchBody, event);
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
