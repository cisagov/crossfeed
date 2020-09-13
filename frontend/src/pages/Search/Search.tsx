import React, { useMemo, useState, useCallback } from 'react';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import {
  ErrorBoundary,
  Facet,
  SearchProvider,
  WithSearch,
  SearchBox,
  Results,
  PagingInfo,
  ResultsPerPage,
  Paging,
  Sorting
} from "@elastic/react-search-ui";
import { Layout, SingleSelectFacet } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";

import {buildRequest, buildAutocompleteRequest} from "./buildRequest";
import applyDisjunctiveFaceting from "./applyDisjunctiveFaceting";
import buildState from "./buildState";


interface ApiResponse {
  suggest: any;
}

// See https://github.com/elastic/search-ui/blob/master/examples/elasticsearch/src
// Demo: https://search-ui-stable-elasticsearch.netlify.app/

export const Search: React.FC = () => {
  const { user, currentOrganization, apiPost } = useAuthContext();


  const config = {
    debug: true,
    hasA11yNotifications: true,
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
      const state = { results: json.suggest["main-suggest"][0].options.map((e: any) => ({text: { raw: e.text }, id: { raw: e._source.id } })) }
      console.error(state.results);
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
      console.error(responseJson);
      const responseJsonWithDisjunctiveFacetCounts = await applyDisjunctiveFaceting(
        responseJson,
        state,
        ["visitors", "states"]
      );
      return buildState(responseJsonWithDisjunctiveFacetCounts, resultsPerPage);
    }
  };

  return (
    <div className={classes.root}>
    <SearchProvider config={config}>
      <WithSearch mapContextToProps={({ wasSearched }: { wasSearched: boolean }) => ({ wasSearched })}>
        {({ wasSearched }: { wasSearched: boolean }) => (
          <div className="App">
            <ErrorBoundary>
              <Layout
                header={
                  <SearchBox
                    autocompleteMinimumCharacters={1}
                    autocompleteResults={{
                      linkTarget: "_blank",
                      sectionTitle: "Results",
                      titleField: "text",
                      urlField: "nps_link",
                      shouldTrackClickThrough: true,
                      clickThroughTags: ["test"]
                    }}
                    autocompleteSuggestions={true}
                  />
                }
                sideContent={
                  <div>
                    {wasSearched && (
                      <Sorting
                        label={"Sort by"}
                        sortOptions={[
                          {
                            name: "Relevance",
                            value: "",
                            direction: ""
                          },
                          {
                            name: "Domain",
                            value: "domain",
                            direction: "asc"
                          }
                        ]}
                      />
                    )}
                    <Facet
                      field="name"
                      label="Name"
                      filterType="any"
                      isFilterable={true}
                    />
                    <Facet
                      field="fromRootDomain"
                      label="fromRootDomain"
                      filterType="any"
                      isFilterable={true}
                    />
                    {/* <Facet field="visitors" label="Visitors" filterType="any" />
                    <Facet
                      field="acres"
                      label="Acres"
                      view={SingleSelectFacet}
                    /> */}
                  </div>
                }
                bodyContent={
                  <Results
                    titleField="name"
                    urlField="nps_link"
                    shouldTrackClickThrough={true}
                  />
                }
                bodyHeader={
                  <React.Fragment>
                    {wasSearched && <PagingInfo />}
                    {wasSearched && <ResultsPerPage />}
                  </React.Fragment>
                }
                bodyFooter={<Paging />}
              />
            </ErrorBoundary>
          </div>
        )}
      </WithSearch>
    </SearchProvider>
    </div>
  );
};

export default Search;
