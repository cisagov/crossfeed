import { CommandOptions } from './ecs-client';
import {
  SavedSearch,
  connectToDatabase,
  Domain,
  Vulnerability
} from '../models';
import ESClient from './es-client';
import { buildRequest } from '../api/search/buildRequest';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';

const client = new ESClient();

const fetchAllResults = async (filters, options, hits): Promise<Domain[]> => {
  const RESULTS_PER_PAGE = 100;
  let results: Domain[] = [];
  for (let cur = 0; cur < Math.max(hits / RESULTS_PER_PAGE); cur++) {
    const request = buildRequest(
      {
        current: cur + 1,
        resultsPerPage: RESULTS_PER_PAGE,
        ...filters
      },
      options
    );
    let searchResults;
    try {
      searchResults = await client.searchDomains(request);
    } catch (e) {
      console.error(e.meta.body.error);
      continue;
    }
    results = results.concat(
      searchResults.body.hits.hits.map((res) => res._source as Domain)
    );
  }
  return results;
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running saved search');

  await connectToDatabase();
  const savedSearches = await SavedSearch.find();
  for (const search of savedSearches) {
    const filters = {
      searchTerm: search.searchTerm,
      sortDirection: search.sortDirection,
      sortField: search.sortField,
      filters: search.filters
    };
    const request = buildRequest(
      {
        current: 1,
        resultsPerPage: 1,
        ...filters
      },
      search.searchRestrictions
    );
    let searchResults;
    try {
      searchResults = await client.searchDomains(request);
    } catch (e) {
      console.error(e.meta.body.error);
      continue;
    }
    const hits: number = searchResults.body.hits.total.value;
    search.count = hits;
    search.save();

    if (search.createVulnerabilities) {
      const results = await fetchAllResults(filters, options, hits);
      const vulnerabilities: Vulnerability[] = results.map((domain) =>
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          ...search.vulnerabilityTemplate,
          state: 'open',
          source: 'saved-search',
          needsPopulation: false
        })
      );
      await saveVulnerabilitiesToDb(vulnerabilities, false);
    }
  }

  console.log(`Saved search finished for ${savedSearches.length} searches`);
};
