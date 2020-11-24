import React, { useEffect, useState } from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

const SearchPage = ({ data, location }) => {
  const { access_key, affiliate, endpoint } = data.site.siteMetadata.searchgov;
  const query = new URLSearchParams(location.search).get('query');

  const [results, setResults] = useState([]);

  useEffect(() => {
    const searchEndpoint = new URL(`${endpoint}/api/v2/search/i14y`);
    searchEndpoint.searchParams.append('affiliate', affiliate);
    searchEndpoint.searchParams.append('access_key', access_key);
    searchEndpoint.searchParams.append('query', query);

    fetch(searchEndpoint)
      .then(r => {
        if (r.ok) {
          return r.json();
        }
        throw new Error(r.statusText);
      })
      .then(posts => {
        setResults(posts.web.results);
      })
      .catch(err => console.log(err));
  }, [query, access_key, affiliate, endpoint]);

  return (
    <Layout>
      <div className="usa-layout-docs usa-section">
        <div className="grid-container">
          <div className="grid-row grid-gap">
            <div className="usa-layout-docs__main desktop:grid-col-9 usa-prose">
              <h1>Search Results</h1>

              {results.length > 0 ? (
                <ol>
                  {results.map((r, idx) => (
                    <li
                      key={idx}
                      className="padding-bottom-5 margin-top-4 usa-prose border-bottom-05 border-base-lightest"
                    >
                      <b className="title">
                        <a href={r.url}>{r.title}</a>
                      </b>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: r.snippet
                            .replace(/class=/g, 'className=')
                            .replace(/\uE000/g, '<span className="bg-yellow">')
                            .replace(/\uE001/g, '</span>'),
                        }}
                      />
                    </li>
                  ))}
                </ol>
              ) : (
                <h4 className="title">
                  No results found for search term: {query}
                </h4>
              )}

              {affiliate === 'federalist-uswds-example' && (
                <div className="usa-alert usa-alert--info">
                  <div className="usa-alert__body">
                    This is an example. You will need to configure your site
                    with search.gov to see the correct search results. To do
                    this:
                    <ol>
                      <li>
                        Create an account with Search.gov at{' '}
                        <a href="https://search.usa.gov/signup">
                          https://search.usa.gov/signup
                        </a>
                      </li>
                      <li>
                        Go to the "Activate" section and get "API Access Key"
                      </li>
                      <li>
                        Open <code>gatsby-config.js</code> and look for{' '}
                        <code>searchgov</code> fields
                      </li>
                      <li>
                        Add your <code>affiliate</code> and{' '}
                        <code>access_key</code>
                      </li>
                      <li>
                        Your results will not show up immediately. Make sure you
                        follow{' '}
                        <a href="https://search.gov/manual/searchgov-for-federalist.html">
                          instructions to index your site
                        </a>
                        .
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        searchgov {
          access_key
          affiliate
          endpoint
          inline
        }
      }
    }
  }
`;

export default SearchPage;
