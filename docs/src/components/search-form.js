import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { navigate } from '@reach/router';

const SearchForm = ({ navigation, secondaryLinks }) => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        pathPrefix
        siteMetadata {
          searchgov {
            affiliate
            endpoint
            inline
          }
        }
      }
    }
  `);
  const { affiliate, endpoint, inline } = site.siteMetadata.searchgov;

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = e.currentTarget.query.value;
    if (inline) {
      navigate(`${site.pathPrefix}/search?query=${query}`);
    } else {
      window.location.replace(
        `${endpoint}/search?utf8=✓&affiliate=${affiliate}&query=${query}`
      );
    }
  };

  return (
    <form className="usa-search usa-search-small" onSubmit={handleSubmit}>
      <div role="search">
        <label className="usa-sr-only" htmlFor="extended-search-field-small">
          Search small
        </label>
        <input
          className="usa-input usagov-search-autocomplete"
          id="extended-search-field-small"
          type="search"
          name="query"
          autoComplete="off"
        />
        <button className="usa-button" type="submit">
          <span className="usa-sr-only">Search</span>
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
