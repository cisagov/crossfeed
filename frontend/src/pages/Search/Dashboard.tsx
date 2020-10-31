import React, { useEffect, useState } from 'react';
import { DomainDetails, Subnav } from 'components';
import { ResultCard } from './ResultCard';
import {
  makeStyles,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Typography
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { withSearch } from '@elastic/react-search-ui';
import { FilterDrawer } from './FilterDrawer';
import { ContextType } from '../../context/SearchProvider';
import { SortBar } from './SortBar';
import { FilterTags } from './FilterTags';

export const DashboardUI: React.FC<ContextType> = (props) => {
  const {
    current,
    setCurrent,
    resultsPerPage,
    setResultsPerPage,
    filters,
    addFilter,
    removeFilter,
    results,
    facets,
    clearFilters,
    sortDirection,
    sortField,
    setSort,
    totalPages,
    totalResults,
    setSearchTerm
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

  useEffect(() => {
    // Search on initial load
    setSearchTerm("");
  }, [setSearchTerm]);

  return (
    <div className={classes.root}>
      <FilterDrawer
        addFilter={addFilter}
        removeFilter={removeFilter}
        filters={filters}
        facets={facets}
      />

      <div className={classes.contentWrapper}>
        <Subnav
          items={[
            { title: 'Assets', path: '/inventory' },
            { title: 'Vulnerabilities', path: '/inventory/vulnerabilities' }
          ]}
        >
          <FilterTags filters={filters} removeFilter={removeFilter} />
        </Subnav>
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
        <Paper classes={{ root: classes.pagination }}>
          <span>
            <strong>
              {(current - 1) * resultsPerPage + 1} -{' '}
              {Math.min(
                (current - 1) * resultsPerPage + resultsPerPage,
                totalResults
              )}
            </strong>{' '}
            of <strong>{totalResults}</strong>
          </span>
          <Pagination
            count={totalPages}
            page={current}
            onChange={(_, page) => setCurrent(page)}
            color="primary"
            size="small"
          />
          <FormControl
            variant="outlined"
            className={classes.pageSize}
            size="small"
          >
            <Typography id="results-per-page-label">
              Results per page:
            </Typography>
            <Select
              id="teststa"
              labelId="results-per-page-label"
              value={resultsPerPage}
              onChange={(e) => setResultsPerPage(e.target.value as number)}
            >
              {[15, 45, 90].map((perPage) => (
                <MenuItem key={perPage} value={perPage}>
                  {perPage}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
    sortDirection,
    sortField,
    setSort,
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent,
    totalPages
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
    setSort,
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent,
    totalPages
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  },
  pageSize: {
    '& > p': {
      margin: '0 1rem 0 2rem'
    },
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  }
}));
