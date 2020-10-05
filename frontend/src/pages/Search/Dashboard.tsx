import React, { useState } from 'react';
import { SearchBar, DomainDetails, TablePaginationActions } from 'components';
import { ResultCard } from './ResultCard';
import { makeStyles, Paper, TablePagination } from '@material-ui/core';
import { withSearch } from '@elastic/react-search-ui';
import { FilterDrawer } from './FilterDrawer';
import { ContextType } from './SearchProvider';
import { FilterTags } from './FilterTags';

export const DashboardUI: React.FC<ContextType> = (props) => {
  const {
    current,
    setCurrent,
    resultsPerPage,
    setResultsPerPage,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    results,
    totalResults,
    autocompletedResults,
    facets,
    clearFilters
  } = props;
  const classes = useStyles();
  const [selectedDomain, setSelectedDomain] = useState('');

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
          onClear={filters.length > 0 ? () => clearFilters([]) : undefined}
          autocompletedResults={autocompletedResults}
          onSelectResult={setSelectedDomain}
        />
        <div className={classes.status}>
          <div>
            Showing&nbsp;<strong>{totalResults}</strong>&nbsp;domains
          </div>
          <FilterTags filters={filters} removeFilter={removeFilter} />
        </div>
        <div className={classes.content}>
          <div className={classes.panel}>
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
        <Paper classes={{ root: classes.pagination }}>
          <TablePagination
            component="div"
            count={totalResults}
            page={current - 1}
            onChangePage={(_, page) => setCurrent(page + 1)}
            rowsPerPage={resultsPerPage ?? 20}
            onChangeRowsPerPage={(e) =>
              setResultsPerPage(parseInt(e?.target.value) ?? 20)
            }
            rowsPerPageOptions={[5, 10, 20, 50, 100]}
            ActionsComponent={TablePaginationActions}
          />
        </Paper>
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
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent
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
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent
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
  },
  pagination: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'flex-end',
    padding: '0 2rem'
  }
}));
