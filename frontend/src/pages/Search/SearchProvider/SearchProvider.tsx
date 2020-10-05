import React from 'react';
import { buildRequest, buildAutocompleteRequest } from './buildRequest';
import applyDisjunctiveFaceting from './applyDisjunctiveFaceting';
import buildState from './buildState';
import { useAuthContext } from 'context';
import { SearchProvider as ESProvider } from '@elastic/react-search-ui';

interface ApiResponse {
  suggest: any;
}

export const SearchProvider: React.FC = ({ children }) => {
  const { apiPost } = useAuthContext();

  const config = {
    debug: true,
    alwaysSearchOnInitialLoad: true,

    onResultClick: () => {
      /* Not implemented */
    },
    onAutocompleteResultClick: (e: any, f: any) => {
      console.error(e, f);
    },
    onAutocomplete: async ({ searchTerm }: { searchTerm: string }) => {
      const requestBody = buildAutocompleteRequest({ searchTerm });
      const json = await apiPost<ApiResponse>('/search', {
        body: {
          ...requestBody
        },
        showLoading: false
      });
      // const state = buildState(json);
      const state = {
        results: json.suggest['main-suggest'][0].options.map((e: any) => ({
          text: { raw: e.text },
          id: { raw: e._source.id }
        }))
      };
      // console.error(state.results);
      return {
        autocompletedResults: state.results
      };
    },
    onSearch: async (state: any) => {
      const { resultsPerPage } = state;
      const requestBody = buildRequest(state);
      // Note that this could be optimized by running all of these requests
      // at the same time. Kept simple here for clarity.
      const responseJson = await apiPost<ApiResponse>('/search', {
        body: {
          ...requestBody
        }
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
