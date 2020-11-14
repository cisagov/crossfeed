import { CommandOptions } from './ecs-client';
import { SavedSearch, connectToDatabase } from '../models';
import ESClient from './es-client';
import { buildRequest } from '../api/search/buildRequest';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running saved search');

  await connectToDatabase();
  const savedSearches = await SavedSearch.find();
  const client = new ESClient();
  for (const search of savedSearches) {
    const options = {
      organizationIds: [],
      matchAllOrganizations: true
    };
    const request = buildRequest(
      {
        current: 1,
        resultsPerPage: 15,
        searchTerm: search.searchTerm,
        sortDirection: search.sortDirection,
        sortField: search.sortField,
        filters: search.filters
      },
      options
    );
    let searchResults;
    try {
      searchResults = await client.searchDomains(request);
    } catch (e) {
      console.error(e.meta.body.error);
      throw e;
    }
    console.log(searchResults.body.hits.total);
  }

  console.log(savedSearches);

  console.log(`Saved search finished for ${savedSearches.length} searches`);
};
