import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paper, ButtonGroup } from '@mui/material';
import { Pagination } from '@mui/material';
import { useAuthContext } from 'context';
import { SavedSearch } from 'types';
import { Subnav } from 'components';
import {
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef
} from '@trussworks/react-uswds';
import { ModalToggleButton } from 'components';
import { NoResults } from 'components/NoResults';
import { classes, Root } from './style';
import { getUserLevel, GLOBAL_VIEW, ALL_USERS } from 'context/userStateUtils';

const Feeds = () => {
  const { user, apiGet, apiDelete } = useAuthContext();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [pageState, setPageState] = useState({
    totalResults: 0,
    current: 1,
    resultsPerPage: 20,
    totalPages: 0
  });
  const [noResults, setNoResults] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const [selectedSearch, setSelectedSearch] = useState<string>('');

  const userLevel = getUserLevel(user);

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
    <Root className={classes.root}>
      <div className={classes.contentWrapper}>
        <Subnav
          items={[
            {
              title: 'My Saved Searches',
              path: '/feeds',
              exact: true,
              users: ALL_USERS
            },
            {
              title: 'P&E APP',
              path: {
                pathname: `${process.env.REACT_APP_API_URL}/pe`
              },
              users: GLOBAL_VIEW,
              externalLink: true
            }
          ].filter(({ users }) => (users & userLevel) > 0)}
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
                              modalRef.current?.toggleModal(undefined, true);
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
      <Modal ref={modalRef} id="modal">
        <ModalHeading>Delete search?</ModalHeading>
        <p>Are you sure that you would like to delete this saved search?</p>
        <ModalFooter>
          <ButtonGroup>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              onClick={() => {
                deleteSearch(selectedSearch);
              }}
            >
              Delete
            </ModalToggleButton>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              unstyled
              className="padding-105 text-center"
            >
              Cancel
            </ModalToggleButton>
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </Root>
  );
};

export default Feeds;
