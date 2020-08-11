import React, { useMemo, useState, useCallback } from 'react';
import { TableInstance, Row } from 'react-table';
import { Query } from 'types';
import { useAuthContext } from 'context';
import { Table, Paginator } from 'components';
import { createColumns } from './columns';
import { Vulnerability } from 'types';
import classes from './styles.module.scss';
import { Grid, Checkbox } from '@trussworks/react-uswds';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
}

export const Vulnerabilities: React.FC = () => {
  const { user, currentOrganization, apiPost } = useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const columns = useMemo(() => createColumns(), []);
  const [showAll, setShowAll] = useState<boolean>(
    JSON.parse(localStorage.getItem('showGlobal') ?? 'false')
  );

  const updateShowAll = (state: boolean) => {
    setShowAll(state);
    localStorage.setItem('showGlobal', JSON.stringify(state));
  };

  const fetchVulnerabilities = useCallback(
    async (query: Query<Vulnerability>) => {
      const { page, sort, filters } = query;
      try {
        const tableFilters = filters
          .filter(f => Boolean(f.value))
          .reduce(
            (accum, next) => ({
              ...accum,
              [next.id]: next.value
            }),
            {}
          );
        const { result, count } = await apiPost<ApiResponse>(
          '/vulnerabilities/search',
          {
            body: {
              page,
              sort: sort[0]?.id ?? 'createdAt',
              order: sort[0]?.desc ? 'DESC' : 'ASC',
              filters: {
                ...tableFilters,
                organization: showAll ? undefined : currentOrganization?.id
              }
            }
          }
        );
        setVulnerabilities(result);
        setPageCount(Math.ceil(count / 25));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost, showAll]
  );

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator table={table} />
  );

  const renderExpanded = useCallback((row: Row<Vulnerability>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        <h4>Details</h4>
        <div className={classes.desc}>
          {original.cve && (
            <a
              href={`https://nvd.nist.gov/vuln/detail/${original.cve}`}
              target="_blank"
            >
              View vulnerability description
            </a>
          )}
        </div>
      </div>
    );
  }, []);

  return (
    <div className={classes.root}>
      <Grid row>
        <Grid tablet={{ col: true }}>
          <h1>
            Vulnerabilities
            {showAll
              ? ' - Global'
              : currentOrganization
              ? ' - ' + currentOrganization.name
              : ''}
          </h1>
        </Grid>
        <Grid style={{ float: 'right' }}>
          {((user?.roles && user.roles.length > 1) ||
            user?.userType === 'globalView' ||
            user?.userType === 'globalAdmin') && (
            <Checkbox
              id="showAll"
              name="showAll"
              label="Show all organizations"
              checked={showAll}
              onChange={e => updateShowAll(e.target.checked)}
              className={classes.showAll}
            />
          )}
        </Grid>
      </Grid>
      <Table<Vulnerability>
        renderPagination={renderPagination}
        columns={columns}
        data={vulnerabilities}
        pageCount={pageCount}
        fetchData={fetchVulnerabilities}
        renderExpanded={renderExpanded}
      />
    </div>
  );
};

export default Vulnerabilities;
