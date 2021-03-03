import React from 'react';
import applyDisjunctiveFaceting from './applyDisjunctiveFaceting';
import buildState from './buildState';
import { useAuthContext } from 'context';
import { SearchProvider as ESProvider } from '@elastic/react-search-ui';

interface ApiResponse {
  suggest: any;
}

export const SearchProvider: React.FC = ({ children }) => {
  const {
    apiPost,
    currentOrganization,
    showAllOrganizations
  } = useAuthContext();

  const config = {
    debug: false,
    alwaysSearchOnInitialLoad: false,
    initialState: {
      resultsPerPage: 15,
      sortField: 'name',
      sortDirection: 'asc'
    },

    onResultClick: () => {
      /* Not implemented */
    },
    onAutocompleteResultClick: (e: any, f: any) => {
      console.error(e, f);
    },
    onAutocomplete: async ({ searchTerm }: { searchTerm: string }) => {
      // const requestBody = buildAutocompleteRequest({ searchTerm });
      // const json = await apiPost<ApiResponse>('/search', {
      //   body: {
      //     ...requestBody
      //   },
      //   showLoading: false
      // });
      // // const state = buildState(json);
      // const state = {
      //   results: json.suggest['main-suggest'][0].options.map((e: any) => ({
      //     text: { raw: e.text },
      //     id: { raw: e._source.id }
      //   }))
      // };
      // // console.error(state.results);
      // return {
      //   autocompletedResults: state.results
      // };
    },
    onSearch: async (state: any) => {
      const {
        current,
        filters,
        resultsPerPage,
        searchTerm,
        sortDirection,
        sortField
      } = state;
      let body: any = {
        current,
        filters,
        resultsPerPage,
        searchTerm,
        sortDirection,
        sortField
      };
      if (!showAllOrganizations && currentOrganization) {
        if ('rootDomains' in currentOrganization)
          body.organizationId = currentOrganization.id;
        else body.tagId = currentOrganization.id;
      }
      const responseJson = await apiPost<ApiResponse>('/search', {
        body
      });
      const responseJsonWithDisjunctiveFacetCounts = await applyDisjunctiveFaceting(
        responseJson,
        state,
        ['fromRootDomain']
      );
      return buildState(responseJsonWithDisjunctiveFacetCounts, resultsPerPage);
    }
  };

  return <ESProvider config={config}>{children}</ESProvider>;
};
