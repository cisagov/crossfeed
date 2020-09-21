import React, { useCallback, useState, useEffect } from 'react';
import { MTable, Export, SearchBar, TablePaginationActions } from 'components';
import { Domain } from 'types';
import { getServiceNames } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Grid, Checkbox } from '@trussworks/react-uswds';
import { usePersistentState, useDomainApi } from 'hooks';
import { useDashboardTable } from './useDashboardTable';
import { TablePagination, TableRow } from '@material-ui/core';

const PAGE_SIZE = 25;

export const Dashboard: React.FC = () => {
  const { user, currentOrganization } = useAuthContext();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const { listDomains } = useDomainApi();

  const table = useDashboardTable(domains, {
    count,
    pageCount
  });

  const {
    state: { sortBy, pageIndex, filters }
  } = table;

  const [showAll, setShowAll] = usePersistentState<boolean>(
    'showGlobal',
    false
  );

  const fetchDomains = useCallback(async () => {
    try {
      const { domains, count, pageCount } = await listDomains({
        sort: sortBy,
        page: pageIndex + 1,
        filters,
        pageSize: PAGE_SIZE,
        showAll
      });
      setDomains(domains);
      setCount(count);
      setPageCount(pageCount);
    } catch (e) {
      console.error(e);
    }
  }, [sortBy, pageIndex, filters, showAll, listDomains]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const fetchDomainsExport = async (): Promise<any[]> => {
    const { sortBy, filters } = table.state ?? {};
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

  return (
    <>
      <SearchBar />
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
        <MTable<Domain>
          instance={table}
          footerRows={
            <TableRow>
              <TablePagination
                count={count}
                page={pageIndex}
                rowsPerPage={PAGE_SIZE}
                onChangePage={(_, page) => table.gotoPage(page)}
                rowsPerPageOptions={[]}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          }
        />
        <Export<Domain>
          name="domains"
          fieldsToExport={[
            'name',
            'ip',
            'id',
            'ports',
            'services',
            'updatedAt'
          ]}
          getDataToExport={fetchDomainsExport}
        />
      </div>
    </>
  );
};
