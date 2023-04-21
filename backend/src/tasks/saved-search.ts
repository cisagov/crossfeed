import { CommandOptions } from './ecs-client';
import { SavedSearch, connectToDatabase, Vulnerability, User } from '../models';
import ESClient from './es-client';
import { buildRequest } from '../api/search/buildRequest';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import {
  getOrgMemberships,
  isGlobalViewAdmin,
  userTokenBody
} from '../api/auth';
import { fetchAllResults } from '../api/search';

export const handler = async (commandOptions: CommandOptions) => {
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
    const user = await User.findOne(search.createdBy);
    const event = {
      requestContext: { authorizer: userTokenBody(user) }
    } as any;
    const restrictions = {
      organizationIds: getOrgMemberships(event),
      matchAllOrganizations: isGlobalViewAdmin(event)
    };
    const request = buildRequest(
      {
        current: 1,
        resultsPerPage: 1,
        ...filters
      },
      restrictions
    );
    let searchResults;
    try {
      const client = new ESClient();
      searchResults = await client.searchDomains(request);
    } catch (e) {
      console.error(e.meta.body.error);
      continue;
    }
    const hits: number = searchResults.body.hits.total.value;
    search.count = hits;
    search.save();

    if (search.createVulnerabilities) {
      const results = await fetchAllResults(filters, restrictions);
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
