import React, { useCallback, useState, useMemo, useRef } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, Export } from 'components';
import { Domain } from 'types';
import { createColumns, getServiceNames } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Grid, Checkbox } from '@trussworks/react-uswds';
import { usePersistentState, useDomainApi } from 'hooks';

const PAGE_SIZE = 25;

export const Dashboard: React.FC = () => {
  const { user, currentOrganization } = useAuthContext();
  const tableRef = useRef<TableInstance<Domain>>(null);
  const columns = useMemo(() => createColumns(), []);
  const [domains, setDomains] = useState<Domain[]>([]);

  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [showAll, setShowAll] = usePersistentState<boolean>(
    'showGlobal',
    false
  );

  const { listDomains } = useDomainApi(showAll);

  const fetchDomains = useCallback(
    async (q: Query<Domain>) => {
      try {
        const { domains, count, pageCount } = await listDomains(q);
        setDomains(domains);
        setCount(count);
        setPageCount(pageCount);
      } catch (e) {
        console.error(e);
      }
    },
    [listDomains]
  );

  const fetchDomainsExport = async (): Promise<any[]> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    try {
      const { domains } = await listDomains({
        sort: sortBy ?? [],
        page: 1,
        pageSize: -1,
        filters: filters ?? []
      });
      return domains.map(domain => ({
        ...domain,
        ports: domain.services.map(service => service.port).join(','),
        services: getServiceNames(domain)
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

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
        tableRef={tableRef}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomains}
        count={count}
        pageSize={PAGE_SIZE}
      />
      <Export<Domain>
        name="domains"
        fieldsToExport={['name', 'ip', 'id', 'ports', 'services', 'updatedAt']}
        getDataToExport={fetchDomainsExport}
      />
    </div>
  );
};
