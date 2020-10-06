import React, { useState } from 'react';
import { SearchBar, DomainDetails } from 'components';
import { ResultCard } from './ResultCard';
import { makeStyles } from '@material-ui/core';
import { withSearch } from '@elastic/react-search-ui';
import { FilterDrawer } from './FilterDrawer';
import { ContextType } from './SearchProvider';
import { SortBar } from './SortBar';

export const DashboardUI: React.FC<ContextType> = (props) => {
  const {
    // current,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    results,
    autocompletedResults,
    facets,
    clearFilters,
    sortDirection,
    sortField,
    setSort
  } = props;
  const classes = useStyles();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [resultsScrolled, setResultsScrolled] = useState(false);

  const handleResultScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 0) {
      setResultsScrolled(true);
    } else {
      setResultsScrolled(false);
    }
  };

  return (
    <div className={classes.root}>
      <FilterDrawer
        addFilter={addFilter}
        removeFilter={removeFilter}
        filters={filters}
        facets={facets}
      />

      <div className={classes.contentWrapper}>
        <SearchBar
          value={searchTerm}
          onChange={(value) =>
            setSearchTerm(value, {
              shouldClearFilters: false,
              autocompleteResults: true
            })
          }
          autocompletedResults={autocompletedResults}
          onSelectResult={setSelectedDomain}
        />
        <SortBar
          sortField={sortField}
          sortDirection={sortDirection}
          setSort={setSort}
          isFixed={resultsScrolled}
          clearFilters={filters.length > 0 ? () => clearFilters([]) : undefined}
        />
        <div className={classes.content}>
          <div className={classes.panel} onScroll={handleResultScroll}>
            {results.map((result) => (
              <ResultCard
                key={result.id.raw}
                {...result}
                onDomainSelected={(id) => setSelectedDomain(id)}
                selected={result.id.raw === selectedDomain}
              />
            ))}
          </div>
          <div className={classes.panel}>
            {selectedDomain && <DomainDetails domainId={selectedDomain} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = withSearch(
  ({
    addFilter,
    removeFilter,
    results,
    totalResults,
    filters,
    facets,
    searchTerm,
    setSearchTerm,
    autocompletedResults,
    clearFilters,
    sortDirection,
    sortField,
    setSort
  }: ContextType) => ({
    addFilter,
    removeFilter,
    results,
    totalResults,
    filters,
    facets,
    searchTerm,
    setSearchTerm,
    autocompletedResults,
    clearFilters,
    sortDirection,
    sortField,
    setSort
  })
)(DashboardUI);

const useStyles = makeStyles(() => ({
  tableRoot: {
    marginTop: '0'
  },
  root: {
    position: 'relative',
    flex: '1',
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0',
    overflowY: 'hidden'
  },
  contentWrapper: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden'
  },
  status: {
    display: 'flex',
    margin: '1rem 0 1rem 1rem',
    fontSize: '1.2rem',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden'
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 50%'
  }
}));
