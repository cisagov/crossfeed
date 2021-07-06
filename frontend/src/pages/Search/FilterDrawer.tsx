import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  Paper,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails,
  makeStyles,
  withStyles
} from '@material-ui/core';
import { ExpandMore, FiberManualRecordRounded } from '@material-ui/icons';
import { FaFilter } from 'react-icons/fa';
import { TaggedArrayInput, FacetFilter } from 'components';
import { ContextType } from '../../context/SearchProvider';
import { useAuthContext } from 'context';
import { SavedSearch } from 'types';
import { useHistory } from 'react-router-dom';

interface Props {
  addFilter: ContextType['addFilter'];
  removeFilter: ContextType['removeFilter'];
  filters: ContextType['filters'];
  facets: ContextType['facets'];
  clearFilters: ContextType['clearFilters'];
}

const FiltersApplied: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.applied}>
      <FiberManualRecordRounded /> Filters Applied
    </div>
  );
};

export const FilterDrawer: React.FC<Props> = (props) => {
  const { filters, addFilter, removeFilter, facets, clearFilters } = props;
  const classes = useStyles();
  const history = useHistory();

  const { apiGet, apiDelete } = useAuthContext();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  const [pageState, setPageState] = useState({
    totalResults: 0,
    current: 1,
    resultsPerPage: 20,
    totalPages: 0
  });
  const [noResults, setNoResults] = useState(false);
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedSearch, setSelectedSearch] = useState<string>('');
  const [searchFacet, setSearchFacet] = useState<{
    value: string;
    count: number;
  }>();

  const fetchSavedSearches = useCallback(
    async (page: number) => {
      try {
        let res = await apiGet<{ result: SavedSearch[]; count: number }>(
          `/saved-searches/?page=${page}&pageSize=${pageState.resultsPerPage}`
        );

        setSavedSearches(res.result);
        setPageState((pageState) => ({
          ...pageState,
          current: page,
          totalResults: res.count,
          totalPages: Math.ceil(res.count / pageState.resultsPerPage)
        }));
        setNoResults(res.count === 0);
      } catch (e) {
        console.error(e);
      }
      // eslint-disable-next-line
    },
    [apiGet, pageState.resultsPerPage]
  );

  useEffect(() => {
    fetchSavedSearches(1);
  }, [fetchSavedSearches]);

  const deleteSearch = async (id: string) => {
    try {
      await apiDelete(`/saved-searches/${id}`);
      setSavedSearches(savedSearches.filter((search) => search.id !== id));
    } catch (e) {
      console.log(e);
    }
  };

  

  const filtersByColumn = useMemo(
    () =>
      filters.reduce(
        (allFilters, nextFilter) => ({
          ...allFilters,
          [nextFilter.field]: nextFilter.values
        }),
        {} as Record<string, string[]>
      ),
    [filters]
  );

  const portFacet: any[] = facets['services.port']
    ? facets['services.port'][0].data
    : [];

  const fromDomainFacet: any[] = facets['fromRootDomain']
    ? facets['fromRootDomain'][0].data
    : [];

  const cveFacet: any[] = facets['vulnerabilities.cve']
    ? facets['vulnerabilities.cve'][0].data
    : [];

  const severityFacet: any[] = facets['vulnerabilities.severity']
    ? facets['vulnerabilities.severity'][0].data
    : [];

  // Always show all severities
  for (const value of ['Critical', 'High', 'Medium', 'Low']) {
    if (!severityFacet.find((severity) => value === severity.value))
      severityFacet.push({ value, count: 0 });
  }

  return (
    <Wrapper>
      <div className={classes.header}>
        <div className={classes.filter}>
          <FaFilter /> <h3>Filter</h3>
        </div>
        {clearFilters && (
          <div>
            <button onClick={clearFilters}>Clear All Filters</button>
          </div>
        )}
      </div>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Saved Searches</div>
          {filtersByColumn['savedSearches']?.length > 0 && <FiltersApplied />}
        </AccordionSummary>
        {savedSearches.map((search: SavedSearch) => {
          const filterDisplay: string[] = [];
          const filterMap: { [name: string]: string } = {
            'services.port': 'Port',
            fromRootDomain: 'Root Domain',
            'vulnerabilities.cve': 'CVE',
            'vulnerabilities.severity': 'Severity',
            ip: 'IP',
            name: 'Domain'
          };
          if (search.searchTerm)
            filterDisplay.push(`Search: ${search.searchTerm}`);
          for (const filter of search.filters) {
            const label =
              filter.field in filterMap
                ? filterMap[filter.field]
                : filter.field;
            filterDisplay.push(`${label}: ${filter.values.join(', ')}`);
          }
          const savedSearchFacet = [
            { value: search.name, count: search.count }
          ];
          const searchPath = search.searchPath;
          const id = search.id;
          return (
            <AccordionDetails classes={{ root: classes.details }}>
              <FacetFilter
                savedSearch = {true}
                options={savedSearchFacet}
                selected={filtersByColumn['vulnerabilities.saved-search'] ?? []}
                onSelect={(value) => {
                  addFilter('vulnerabilities.saved-search', value, 'any');
                  history.push(searchPath);
                }}
                onDeselect={(value) =>
                  removeFilter('vulnerabilities.saved-search', value, 'any')
                }
              />
            </AccordionDetails>
          );
        })}
      </Accordion>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>IP(s)</div>
          {filtersByColumn['ip']?.length > 0 && <FiltersApplied />}
        </AccordionSummary>
        <AccordionDetails classes={{ root: classes.details }}>
          <TaggedArrayInput
            placeholder="IP address"
            values={filtersByColumn.ip ?? []}
            onAddTag={(value) => addFilter('ip', value, 'any')}
            onRemoveTag={(value) => removeFilter('ip', value, 'any')}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Domain(s)</div>
          {filtersByColumn['name']?.length > 0 && <FiltersApplied />}
        </AccordionSummary>
        <AccordionDetails classes={{ root: classes.details }}>
          <TaggedArrayInput
            placeholder="Domain"
            values={filtersByColumn.name ?? []}
            onAddTag={(value) => addFilter('name', value, 'any')}
            onRemoveTag={(value) => removeFilter('name', value, 'any')}
          />
        </AccordionDetails>
      </Accordion>
      {fromDomainFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Root Domain(s)</div>
            {filtersByColumn['fromRootDomain']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={fromDomainFacet}
              selected={filtersByColumn['fromRootDomain'] ?? []}
              onSelect={(value) => addFilter('fromRootDomain', value, 'any')}
              onDeselect={(value) =>
                removeFilter('fromRootDomain', value, 'any')
              }
              savedSearch={false}
            />
          </AccordionDetails>
        </Accordion>
      )}
      {portFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Port(s)</div>
            {filtersByColumn['services.port']?.length > 0 && <FiltersApplied />}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={portFacet}
              selected={filtersByColumn['services.port'] ?? []}
              onSelect={(value) => addFilter('services.port', value, 'any')}
              onDeselect={(value) =>
                removeFilter('services.port', value, 'any')
              }
              savedSearch={false}
            />
          </AccordionDetails>
        </Accordion>
      )}
      {cveFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>CVE(s)</div>
            {filtersByColumn['vulnerabilities.cve']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={cveFacet}
              selected={filtersByColumn['vulnerabilities.cve'] ?? []}
              onSelect={(value) =>
                addFilter('vulnerabilities.cve', value, 'any')
              }
              onDeselect={(value) =>
                removeFilter('vulnerabilities.cve', value, 'any')
              }
              savedSearch={false}
            />
          </AccordionDetails>
        </Accordion>
      )}
      {severityFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Severity</div>
            {filtersByColumn['vulnerabilities.severity']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={severityFacet}
              selected={filtersByColumn['vulnerabilities.severity'] ?? []}
              onSelect={(value) =>
                addFilter('vulnerabilities.severity', value, 'any')
              }
              onDeselect={(value) =>
                removeFilter('vulnerabilities.severity', value, 'any')
              }
              savedSearch={false}
            />
          </AccordionDetails>
        </Accordion>
      )}
    </Wrapper>
  );
};

const Accordion = withStyles({
  root: {
    backgroundColor: '#f4f4f4',
    borderTop: '1px solid rgba(0,0,0,.125)',
    borderBottom: '1px solid rgba(0,0,0,.125)',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    margin: 0,
    '&$expanded': {
      margin: 0
    },
    '&$disabled': {
      backgroundColor: '#f4f4f4'
    }
  },
  disabled: {},
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    color: '#3D4551',
    minHeight: 64,
    '&$expanded': {
      minHeight: 64
    },
    '&:focus': {
      outline: 'none !important'
    },
    '&$disabled': {
      opacity: 1,
      fontWeight: 600,

      '& svg': {
        opacity: 0.5
      }
    }
  },
  content: {
    flexFlow: 'column nowrap',
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  disabled: {},
  expanded: {}
})(MuiAccordionSummary);

const Wrapper = withStyles({
  root: {
    height: '100%',
    position: 'relative',
    flex: '0 0 250px',
    backgroundColor: '#f4f4f4',
    color: '#3D4551',
    overflowY: 'auto',
    zIndex: 10,
    borderRadius: 0,
    borderRight: '1px solid #C3C5C7',
    boxShadow: 'none'
  }
})(Paper);

const useStyles = makeStyles((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    padding: '0 1rem',
    minHeight: 60,
    justifyContent: 'space-between',
    '& h3': {
      fontSize: '1.3rem',
      fontWeight: 400,
      margin: 0,
      marginLeft: '1rem'
    },
    '& button': {
      outline: 'none',
      border: 'none',
      color: '#71767A',
      background: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  },
  details: {
    paddingTop: 0
    // maxHeight: 250,
    // overflowY: 'auto'
  },
  applied: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: theme.palette.grey['500'],

    '& svg': {
      fontSize: '0.7rem',
      color: theme.palette.primary.main,
      marginRight: 3
    }
  },
  filter: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    '& > span': {
      display: 'block'
    }
  }
}));
