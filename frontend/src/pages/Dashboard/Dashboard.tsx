import React, { useCallback, useState, useEffect } from 'react';
import { MTable, Export, SearchBar, TablePaginationActions } from 'components';
import { Domain } from 'types';
import { getServiceNames } from '../../components/columns';
import { usePersistentState, useDomainApi } from 'hooks';
import { useDashboardTable } from './useDashboardTable';
import { TablePagination, TableRow, makeStyles } from '@material-ui/core';
import { FilterDrawer } from './FilterDrawer';

const PAGE_SIZE = 25;

export const Dashboard: React.FC = () => {
  const classes = useStyles();
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

  const [showAll] = usePersistentState<boolean>('showGlobal', false);

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
    <div className={classes.root}>
      <FilterDrawer instance={table} />

      <div className={classes.content}>
        <SearchBar />
        <MTable<Domain>
          classes={{ root: classes.tableRoot }}
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
    </div>
  );
};

const useStyles = makeStyles(() => ({
  tableRoot: {
    marginTop: '2rem'
  },
  root: {
    position: 'relative',
    flex: '1',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0'
  },
  content: {
    position: 'relative',
    flex: '1 1 auto',
    overflowY: 'auto',
    height: '100%'
  }
}));
