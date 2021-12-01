import React, { useCallback, useEffect, useState } from 'react';
import { Paper, makeStyles } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { useAuthContext } from 'context';
import { SavedSearch } from 'types';
import { Subnav } from 'components';
import {
  Overlay,
  ModalContainer,
  Button,
  Modal
} from '@trussworks/react-uswds';
import { NoResults } from 'components/NoResults';

const Feeds = () => {
  const classes = useStyles();
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

  const fetchSavedSearches = useCallback(
    async (page: number) => {
      try {
        const res = await apiGet<{ result: SavedSearch[]; count: number }>(
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
      await apiDelete(`/saved-searches/${id}`, { body: {} });
      setSavedSearches(savedSearches.filter((search) => search.id !== id));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.contentWrapper}>
        <Subnav
          items={[{ title: 'My Saved Searches', path: '/feeds', exact: true }]}
        ></Subnav>
        <div className={classes.content}>
          <div className={classes.panel}>
            {noResults && (
              <NoResults
                message={
                  "You don't currently have any saved searches. Try creating a saved search from a search result in your inventory."
                }
              ></NoResults>
            )}
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
              return (
                <a
                  href={
                    '/inventory' + search.searchPath + '&searchId=' + search.id
                  }
                  onClick={() => {
                    console.log('bbb');
                    localStorage.setItem('savedSearch', JSON.stringify(search));
                  }}
                  key={search.id}
                  style={{ textDecoration: 'none' }}
                >
                  <Paper
                    elevation={0}
                    classes={{ root: classes.cardRoot }}
                    aria-label="view domain details"
                  >
                    <div className={classes.cardInner}>
                      <div className={classes.domainRow}>
                        <div className={classes.cardAlerts}>
                          <h4>{search.count} items</h4>
                        </div>
                        <div className={classes.cardDetails}>
                          <h3>{search.name}</h3>
                          <p>{filterDisplay.join(', ')}</p>
                        </div>
                        <div className={classes.cardActions}>
                          <button
                            className={classes.button}
                            onClick={(event) => {
                              event.stopPropagation();
                              localStorage.setItem(
                                'savedSearch',
                                JSON.stringify({ ...search, editing: true })
                              );
                            }}
                          >
                            EDIT
                          </button>
                          <button
                            className={classes.button}
                            onClick={(event) => {
                              event.preventDefault();
                              setShowModal(true);
                              setSelectedSearch(search.id);
                            }}
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  </Paper>
                </a>
              );
            })}
          </div>
        </div>

        <Paper classes={{ root: classes.pagination }}>
          <span>
            <strong>
              {pageState.totalResults === 0
                ? 0
                : (pageState.current - 1) * pageState.resultsPerPage + 1}{' '}
              -{' '}
              {Math.min(
                (pageState.current - 1) * pageState.resultsPerPage +
                  pageState.resultsPerPage,
                pageState.totalResults
              )}
            </strong>{' '}
            of <strong>{pageState.totalResults}</strong>
          </span>
          <Pagination
            count={pageState.totalPages}
            page={pageState.current}
            onChange={(_, page) => {
              fetchSavedSearches(page);
            }}
            color="primary"
            size="small"
          />
        </Paper>
      </div>
      {showModal && (
        <div>
          <Overlay />
          <ModalContainer>
            <Modal
              actions={
                <>
                  <Button
                    outline
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      deleteSearch(selectedSearch);
                      setShowModal(false);
                    }}
                  >
                    Delete
                  </Button>
                </>
              }
              title={<h2>Delete search?</h2>}
            >
              <p>
                Are you sure that you would like to delete this saved search?
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
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
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden',
    marginTop: '2em',
    lineHeight: 1
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 100%'
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
  cardRoot: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '2px solid #DCDEE0',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    },
    height: 90,
    borderRadius: '5px'
  },
  cardInner: {},
  domainRow: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#28A0CB',
    outline: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  row: {
    padding: '0.5rem 0',
    margin: 0
  },
  label: {
    fontSize: '0.8rem',
    color: '#71767A',
    display: 'block'
  },
  count: {
    color: theme.palette.error.light
  },
  data: {
    display: 'block',
    color: '#3D4551'
  },
  cardAlerts: {
    background: '#009BC2',
    boxSizing: 'border-box',
    borderRadius: '5px',
    width: 90,
    height: 86,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& h4': {
      color: 'white',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'break-all'
    }
  },
  cardDetails: {
    display: 'block',
    textAlign: 'left',
    width: '50%',
    '& p': {
      color: '#A9AEB1',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'normal'
    }
  },
  cardActions: {
    display: 'block',
    textAlign: 'right',
    marginRight: 100
  },
  button: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  },
  barWrapper: {
    zIndex: 101,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '100px',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme.shadows[4] : theme.shadows[1],
    transition: 'box-shadow 0.3s linear',
    marginBottom: '40px'
  },
  barInner: {
    flex: '1',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  }
}));

export default Feeds;
