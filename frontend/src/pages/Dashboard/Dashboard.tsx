import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, Export } from 'components';
import { Domain } from 'types';
import { createColumns, getServiceNames } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Grid, Checkbox } from '@trussworks/react-uswds';
import { usePersistentState } from 'hooks';

interface ApiResponse {
  result: Domain[];
  count: number;
}

export const Dashboard: React.FC = () => {
  const { user, currentOrganization, apiPost } = useAuthContext();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [query, setQuery] = useState<Query<Domain>>({
    page: 1,
    sort: [{ id: 'name', desc: true }],
    filters: []
  });
  const [showAll, setShowAll] = usePersistentState('showGlobal', false);
  const columns = useMemo(() => createColumns(), []);
  const PAGE_SIZE = 25;

  const queryDomains = useCallback(
    async ({
      q,
      pageSize = PAGE_SIZE
    }: {
      q: Query<Domain>;
      pageSize?: number;
    }) => {
      const { page, sort, filters } = q;
      const tableFilters = filters
        .filter(f => Boolean(f.value))
        .reduce(
          (accum, next) => ({
            ...accum,
            [next.id]: next.value
          }),
          {}
        );
      return apiPost<ApiResponse>('/domain/search', {
        body: {
          pageSize,
          page,
          sort: sort[0]?.id ?? 'name',
          order: sort[0]?.desc ? 'DESC' : 'ASC',
          filters: {
            ...tableFilters,
            organization: showAll ? undefined : currentOrganization?.id
          }
        }
      });
    },
    [apiPost, currentOrganization, showAll]
  );

  const fetchDomainTable = useCallback(
    async (q: Query<Domain>) => {
      if (!user) {
        return;
      }
      try {
        const { result, count } = await queryDomains({ q });
        setQuery(q);
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [queryDomains, user]
  );

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator table={table} />
  );

  return (
    <div className={classes.root}>
      <Grid row>
        <Grid tablet={{ col: true }}>
          <h1>
            Inventory
            {showAll
              ? ' - Global'
              : currentOrganization
              ? ' - ' + currentOrganization.name
              : ''}
          </h1>{' '}
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
              onChange={e => setShowAll(e.target.checked)}
              className={classes.showAll}
            />
          )}
        </Grid>
      </Grid>
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomainTable}
        count={count}
        pageSize={PAGE_SIZE}
      />
      <Export<
        | Domain
        | {
            services: string;
          }
      >
        name="domains"
        fieldsToExport={['name', 'ip', 'id', 'ports', 'services', 'updatedAt']}
        getDataToExport={async () => {
          const { result } = await queryDomains({ q: query, pageSize: -1 });
          return result.map(domain => ({
            ...domain,
            ports: domain.services.map(service => service.port).join(','),
            services: getServiceNames(domain)
          }));
        }}
      />
    </div>
  );
};
