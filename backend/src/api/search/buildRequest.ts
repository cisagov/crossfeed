import buildRequestFilter from './buildRequestFilter';

function buildFrom(current, resultsPerPage) {
  if (!current || !resultsPerPage) return;
  return (current - 1) * resultsPerPage;
}

const nonKeywordFields = new Set(['updatedAt', 'createdAt']);
function buildSort(sortDirection, sortField) {
  if (!sortDirection || !sortField) {
    return;
  }
  if (nonKeywordFields.has(sortField)) {
    return [{ [sortField]: sortDirection }];
  }
  return [{ [`${sortField}.keyword`]: sortDirection }];
}

function buildMatch(searchTerm) {
  return searchTerm
    ? {
        query_string: {
          query: searchTerm,
          analyze_wildcard: true,
          fields: ['*']
        }
      }
    : { match_all: {} };
}

function buildChildMatch(searchTerm) {
  return searchTerm
    ? {
        query_string: {
          query: searchTerm,
          analyze_wildcard: true,
          fields: ['*']
        }
      }
    : { match_all: {} };
}

/*

  Converts current application state to an Elasticsearch request.

  When implementing an onSearch Handler in Search UI, the handler needs to take the
  current state of the application and convert it to an API request.

  For instance, there is a "current" property in the application state that you receive
  in this handler. The "current" property represents the current page in pagination. This
  method converts our "current" property to Elasticsearch's "from" parameter.

  This "current" property is a "page" offset, while Elasticsearch's "from" parameter
  is a "item" offset. In other words, for a set of 100 results and a page size
  of 10, if our "current" value is "4", then the equivalent Elasticsearch "from" value
  would be "40". This method does that conversion.

  We then do similar things for searchTerm, filters, sort, etc.
*/
export function buildRequest(
  state,
  options: { organizationIds: string[]; matchAllOrganizations: boolean }
) {
  const {
    current,
    filters,
    resultsPerPage,
    searchTerm,
    sortDirection,
    sortField
  } = state;

  const sort = buildSort(sortDirection, sortField);
  const match = buildMatch(searchTerm);
  const size = resultsPerPage;
  const from = buildFrom(current, resultsPerPage);
  const filter = buildRequestFilter(filters);

  let query: any = {
    bool: {
      must: [
        {
          match: {
            parent_join: 'domain'
          }
        },
        {
          bool: {
            should: [
              match,
              {
                has_child: {
                  type: 'webpage',
                  query: buildChildMatch(searchTerm),
                  inner_hits: {
                    _source: ['webpage_url'],
                    highlight: {
                      fragment_size: 50,
                      number_of_fragments: 3,
                      fields: {
                        webpage_body: {}
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      ],
      ...(filter && { filter })
    }
  };
  if (!options.matchAllOrganizations) {
    query = {
      bool: {
        must: [
          {
            terms: {
              'organization.id.keyword': options.organizationIds
            }
          },
          query
        ]
      }
    };
  }

  const body = {
    // Static query Configuration
    // --------------------------
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-highlighting.html
    highlight: {
      fragment_size: 200,
      number_of_fragments: 1,
      fields: {
        name: {}
      }
    },
    //https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-source-filtering.html#search-request-source-filtering
    // _source: ["id", "nps_link", "title", "description"],
    aggs: {
      name: { terms: { field: 'name.keyword' } },
      fromRootDomain: {
        terms: { field: 'fromRootDomain.keyword' }
      },
      organization: {
        terms: { field: 'organization.name.keyword' }
      },
      services: {
        nested: {
          path: 'services'
        },
        aggs: {
          port: {
            terms: {
              field: 'services.port'
            }
          },
          name: {
            terms: {
              field: 'services.service.keyword'
            }
          },
          // TODO: products type nested
          products: {
            nested: {
              path: 'products'
            },
            aggs: {
              cpe: {
                terms: {
                  field: 'services.products.cpe.keyword'
                }
              }
            }
          }
        }
      },
      vulnerabilities: {
        nested: {
          path: 'vulnerabilities'
        },
        aggs: {
          severity: {
            terms: {
              field: 'vulnerabilities.severity.keyword'
            }
          },
          cve: {
            terms: {
              field: 'vulnerabilities.cve.keyword'
            }
          }
        }
      }
      // visitors: {
      //   range: {
      //     field: "visitors",
      //     ranges: [
      //       { from: 0.0, to: 10000.0, key: "0 - 10000" },
      //       { from: 10001.0, to: 100000.0, key: "10001 - 100000" },
      //       { from: 100001.0, to: 500000.0, key: "100001 - 500000" },
      //       { from: 500001.0, to: 1000000.0, key: "500001 - 1000000" },
      //       { from: 1000001.0, to: 5000000.0, key: "1000001 - 5000000" },
      //       { from: 5000001.0, to: 10000000.0, key: "5000001 - 10000000" },
      //       { from: 10000001.0, key: "10000001+" }
      //     ]
      //   }
      // },
      // acres: {
      //   range: {
      //     field: "acres",
      //     ranges: [
      //       { from: -1.0, key: "Any" },
      //       { from: 0.0, to: 1000.0, key: "Small" },
      //       { from: 1001.0, to: 100000.0, key: "Medium" },
      //       { from: 100001.0, key: "Large" }
      //     ]
      //   }
      // }
    },

    // Dynamic values based on current Search UI state
    // --------------------------
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/full-text-queries.html
    query,
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-sort.html
    ...(sort && { sort }),
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-from-size.html
    ...(size && { size }),
    ...(from && { from })
  };
  return body;
}

export function buildAutocompleteRequest(state) {
  const { searchTerm } = state;

  const body = {
    suggest: {
      'main-suggest': {
        prefix: searchTerm,
        completion: {
          field: 'suggest'
        }
      }
    }
  };

  return body;
}
