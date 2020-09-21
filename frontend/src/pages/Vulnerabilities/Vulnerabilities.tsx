import React, { useMemo, useState, useCallback, useRef } from 'react';
import { TableInstance, Row, Filters, SortingRule } from 'react-table';
import { Query } from 'types';
import { useAuthContext } from 'context';
import { Table, Paginator, Export } from 'components';
import { createColumns } from './columns';
import { Vulnerability } from 'types';
import classes from './styles.module.scss';
import { Grid, Checkbox } from '@trussworks/react-uswds';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
}

export const renderExpandedVulnerability = (row: Row<Vulnerability>) => {
  const { original } = row;
  return (
    <div className={classes.expandedRoot}>
      <h4>Details</h4>
      <div className={classes.desc}>
        {original.cve && (
          <a
            href={`https://nvd.nist.gov/vuln/detail/${original.cve}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View vulnerability description
          </a>
        )}
      </div>
    </div>
  );
};

export const Vulnerabilities: React.FC = () => {
  const { user, currentOrganization, apiPost } = useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const columns = useMemo(() => createColumns(), []);
  const tableRef = useRef<TableInstance<Vulnerability>>(null);
  const [showAll, setShowAll] = useState<boolean>(
    JSON.parse(localStorage.getItem('showGlobal') ?? 'false')
  );

  const updateShowAll = (state: boolean) => {
    setShowAll(state);
    localStorage.setItem('showGlobal', JSON.stringify(state));
  };

  const vulnerabilitiesSearch = useCallback(
    async (
      filters: Filters<Vulnerability>,
      sort: SortingRule<Vulnerability>[],
      page: number,
      paginate: boolean
    ): Promise<ApiResponse | undefined> => {
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
        return await apiPost<ApiResponse>('/vulnerabilities/search', {
          body: {
            page,
            sort: sort[0]?.id ?? 'createdAt',
            order: sort[0]?.desc ? 'DESC' : 'ASC',
            filters: {
              ...tableFilters,
              organization: showAll ? undefined : currentOrganization?.id
            },
            pageCount: paginate ? 25 : -1
          }
        });
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [apiPost, currentOrganization, showAll]
  );

  const fetchVulnerabilities = useCallback(
    async (query: Query<Vulnerability>) => {
      const resp = await vulnerabilitiesSearch(
        query.filters,
        query.sort,
        query.page,
        false
      );
      if (!resp) return;
      const { result, count } = resp;
      setVulnerabilities(result);
      setPageCount(Math.ceil(count / 25));
    },
    [vulnerabilitiesSearch]
  );

  const fetchVulnerabilitiesExport = async (): Promise<any[]> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    if (!sortBy || !filters) return [];
    const resp = await vulnerabilitiesSearch(filters, sortBy, 1, true);
    if (!resp) return [];
    return resp.result.map(vuln => ({
      ...vuln,
      domain: vuln.domain.name
    }));
  };

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator table={table} />
  );

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
        renderExpanded={renderExpandedVulnerability}
        tableRef={tableRef}
      />
      <Export<Vulnerability>
        name="vulnerabilities"
        fieldsToExport={[
          'domain',
          'title',
          'cve',
          'cwe',
          'cpe',
          'description',
          'cvss',
          'severity',
          'state',
          'lastSeen',
          'createdAt',
          'id'
        ]}
        getDataToExport={fetchVulnerabilitiesExport}
      />
    </div>
  );
};

export default Vulnerabilities;
