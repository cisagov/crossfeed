import { validateBody, wrapHandler } from './helpers';
import { getOrgMemberships, isGlobalViewAdmin } from './auth';
import { buildRequest } from './search/buildRequest';
import ESClient from '../tasks/es-client';
import { IsArray, IsInt, IsObject, IsString } from 'class-validator';
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

/**
 * @swagger
 *
 * /domain/export:
 *  post:
 *    description: Export domains to a CSV file by specifying a filter.
 *    tags:
 *    - Domains
 */
export const export_ = wrapHandler(async (event) => {
  const searchBody = await validateBody(SearchBody, event.body);
  const options = {
    organizationIds: getOrgMemberships(event),
    matchAllOrganizations: isGlobalViewAdmin(event)
  };
  let results: any = await fetchAllResults(searchBody, options);
  results = results.map((res) => {
    res.organization = res.organization.name;
    res.ports = res.services.map((service) => service.port).join(', ');
    const allServices: { [key: string]: string } = {};
    for (const service of res.services) {
      for (const product of service.products) {
        if (product.name)
          allServices[product.name.toLowerCase()] =
            product.name + (product.version ? ` ${product.version}` : '');
      }
    }
    res.products = Object.values(allServices).join(', ');
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
  const options = {
    organizationIds: getOrgMemberships(event),
    matchAllOrganizations: isGlobalViewAdmin(event)
  };
  const request = buildRequest(searchBody, options);

  const client = new ESClient();
  let searchResults;
  try {
    searchResults = await client.searchDomains(request);
    console.log(searchResults.body);
  } catch (e) {
    console.error(e.meta.body.error);
    throw e;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(searchResults.body)
  };
});
