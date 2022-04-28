import React, { useEffect, useState } from 'react';
import { DomainDetails, Subnav } from 'components';
import { ResultCard } from './ResultCard';
import {
  makeStyles,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextareaAutosize
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { withSearch } from '@elastic/react-search-ui';
import { FilterDrawer } from './FilterDrawer';
import { ContextType } from '../../context/SearchProvider';
import { SortBar } from './SortBar';
import {
  Button as USWDSButton,
  Overlay,
  Modal,
  ModalContainer,
  TextInput,
  Label,
  Dropdown
} from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { FilterTags } from './FilterTags';
import { SavedSearch, Vulnerability } from 'types';
import { useBeforeunload } from 'react-beforeunload';
import { NoResults } from 'components/NoResults';
import { exportCSV } from 'components/ImportExport';

export const DashboardUI: React.FC<ContextType & { location: any }> = (
  props
) => {
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
    setSearchTerm,
    searchTerm,
    noResults
  } = props;
  const classes = useStyles();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [resultsScrolled, setResultsScrolled] = useState(false);
  const {
    apiPost,
    apiPut,
    setLoading,
    showAllOrganizations,
    currentOrganization
  } = useAuthContext();

  const search:
    | (SavedSearch & {
        editing?: boolean;
      })
    | undefined = localStorage.getItem('savedSearch')
    ? JSON.parse(localStorage.getItem('savedSearch')!)
    : undefined;

  const [showSaveSearch, setShowSaveSearch] = useState<Boolean>(
    search && search.editing ? true : false
  );

  const [savedSearchValues, setSavedSearchValues] = useState<
    Partial<SavedSearch> & {
      name: string;
      vulnerabilityTemplate: Partial<Vulnerability>;
    }
  >(
    search
      ? search
      : {
          name: '',
          vulnerabilityTemplate: {},
          createVulnerabilities: false
        }
  );

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setSavedSearchValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  const onVulnerabilityTemplateChange = (e: any) => {
    (savedSearchValues.vulnerabilityTemplate as any)[e.target.name] =
      e.target.value;
    setSavedSearchValues(savedSearchValues);
  };

  const handleResultScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 0) {
      setResultsScrolled(true);
    } else {
      setResultsScrolled(false);
    }
  };

  useEffect(() => {
    if (props.location.search === '') {
      // Search on initial load
      setSearchTerm('');
    }
    return () => {
      localStorage.removeItem('savedSearch');
    };
  }, [setSearchTerm, props.location.search]);

  useBeforeunload((event) => {
    localStorage.removeItem('savedSearch');
  });

  const fetchDomainsExport = async (): Promise<string> => {
    try {
      const body: any = {
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
      const { url } = await apiPost('/search/export', {
        body
      });
      return url!;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  return (
    <div className={classes.root}>
      <FilterDrawer
        addFilter={addFilter}
        removeFilter={removeFilter}
        filters={filters}
        facets={facets}
        clearFilters={filters.length > 0 ? () => clearFilters([]) : undefined}
      />
      <div className={classes.contentWrapper}>
        <Subnav
          items={[
            { title: 'Search Results', path: '/inventory', exact: true },
            { title: 'All Domains', path: '/inventory/domains' },
            { title: 'All Vulnerabilities', path: '/inventory/vulnerabilities' }
          ]}
          styles={{
            paddingLeft: '0%'
          }}
        >
          <FilterTags filters={filters} removeFilter={removeFilter} />
        </Subnav>
        <SortBar
          sortField={sortField}
          sortDirection={sortDirection}
          setSort={setSort}
          isFixed={resultsScrolled}
          saveSearch={
            filters.length > 0 || searchTerm
              ? () => setShowSaveSearch(true)
              : undefined
          }
          existingSavedSearch={search}
        />
        {noResults && (
          <NoResults
            message={"We don't see any results that match your criteria."}
          ></NoResults>
        )}
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
              {(totalResults === 0
                ? 0
                : (current - 1) * resultsPerPage + 1
              ).toLocaleString()}{' '}
              -{' '}
              {Math.min(
                (current - 1) * resultsPerPage + resultsPerPage,
                totalResults
              ).toLocaleString()}
            </strong>{' '}
            of <strong>{totalResults.toLocaleString()}</strong>
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
          <USWDSButton
            className={classes.exportButton}
            outline
            type="button"
            onClick={() =>
              exportCSV(
                {
                  name: 'domains',
                  getDataToExport: fetchDomainsExport
                },
                setLoading
              )
            }
          >
            Export Results
          </USWDSButton>
        </Paper>
      </div>

      {showSaveSearch && (
        <div>
          <Overlay />
          <ModalContainer>
            <Modal
              className={classes.saveSearchModal}
              actions={
                <>
                  <USWDSButton
                    outline
                    type="button"
                    onClick={() => {
                      setShowSaveSearch(false);
                    }}
                  >
                    Cancel
                  </USWDSButton>
                  <USWDSButton
                    type="button"
                    onClick={async () => {
                      const body = {
                        body: {
                          ...savedSearchValues,
                          searchTerm,
                          filters,
                          count: totalResults,
                          searchPath: window.location.search,
                          sortField,
                          sortDirection
                        }
                      };
                      if (search) {
                        await apiPut('/saved-searches/' + search.id, body);
                      } else {
                        await apiPost('/saved-searches/', body);
                      }
                      setShowSaveSearch(false);
                    }}
                  >
                    Save
                  </USWDSButton>
                </>
              }
              title={search ? <h2>Update Search</h2> : <h2>Save Search</h2>}
            >
              <FormGroup>
                <Label htmlFor="name">Name Your Search</Label>
                <TextInput
                  required
                  id="name"
                  name="name"
                  type="text"
                  value={savedSearchValues.name}
                  onChange={onTextChange}
                />
                <p>When a new result is found:</p>
                {/* <FormControlLabel
                  control={
                    <Checkbox
                      // checked={gilad}
                      // onChange={handleChange}
                      name="email"
                    />
                  }
                  label="Email me"
                /> */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={savedSearchValues.createVulnerabilities}
                      onChange={(e) =>
                        onChange(e.target.name, e.target.checked)
                      }
                      id="createVulnerabilities"
                      name="createVulnerabilities"
                    />
                  }
                  label="Create a vulnerability"
                />
                {savedSearchValues.createVulnerabilities && (
                  <>
                    <Label htmlFor="title">Title</Label>
                    <TextInput
                      required
                      id="title"
                      name="title"
                      type="text"
                      value={savedSearchValues.vulnerabilityTemplate.title}
                      onChange={onVulnerabilityTemplateChange}
                    />
                    <Label htmlFor="description">Description</Label>
                    <TextareaAutosize
                      required
                      id="description"
                      name="description"
                      style={{ padding: 10 }}
                      rowsMin={2}
                      value={
                        savedSearchValues.vulnerabilityTemplate.description
                      }
                      onChange={onVulnerabilityTemplateChange}
                    />
                    <Label htmlFor="description">Severity</Label>
                    <Dropdown
                      id="severity"
                      name="severity"
                      onChange={onVulnerabilityTemplateChange}
                      value={
                        savedSearchValues.vulnerabilityTemplate
                          .severity as string
                      }
                      style={{ display: 'inline-block', width: '150px' }}
                    >
                      <option value="None">None</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </Dropdown>
                  </>
                )}
                {/* <h3>Collaborators</h3>
                <p>
                  Collaborators can view vulnerabilities, and domains within
                  this search. Adding a team will make all members
                  collaborators.
                </p>
                <button className={classes.addButton} >
                  <AddCircleOutline></AddCircleOutline> ADD
                </button> */}
              </FormGroup>
            </Modal>
          </ModalContainer>
        </div>
      )}
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
    saveSearch,
    sortDirection,
    sortField,
    setSort,
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent,
    totalPages,
    noResults
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
    saveSearch,
    sortDirection,
    sortField,
    setSort,
    resultsPerPage,
    setResultsPerPage,
    current,
    setCurrent,
    totalPages,
    noResults
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
    boxShadow: '0px -1px 2px rgba(0, 0, 0, 0.15)',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    },
    borderRadius: 0,
    zIndex: 9
  },
  exportButton: {
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  },
  pageSize: {
    '& > p': {
      margin: '0 1rem 0 2rem'
    },
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  },
  saveSearchModal: {},
  addButton: {
    outline: 'none',
    border: 'none',
    color: '#71767A',
    background: 'none',
    cursor: 'pointer'
  }
}));
