import React, { useCallback, useState, useMemo, useRef } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, Subnav } from 'components';
import { Domain } from 'types';
import { createColumns } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { useDomainApi } from 'hooks';

const PAGE_SIZE = 15;

export const Domains: React.FC = () => {
  const { showAllOrganizations } = useAuthContext();
  const tableRef = useRef<TableInstance<Domain>>(null);
  const columns = useMemo(() => createColumns(), []);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const { listDomains } = useDomainApi(showAllOrganizations);

  const fetchDomains = useCallback(
    async (q: Query<Domain>) => {
      try {
        const { domains, count } = await listDomains(q);
        setDomains(domains);
        setTotalResults(count);
      } catch (e) {
        console.error(e);
      }
    },
    [listDomains]
  );

  const fetchDomainsExport = async (): Promise<string> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    try {
      const { url } = await listDomains(
        {
          sort: sortBy ?? [],
          page: 1,
          pageSize: -1,
          filters: filters ?? []
        },
        true
      );
      return url!;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator
      table={table}
      totalResults={totalResults}
      export={{
        name: 'domains',
        getDataToExport: fetchDomainsExport
      }}
    />
  );

  return (
    <div className={classes.root}>
      <Subnav
        items={[
          { title: 'Search Results', path: '/inventory', exact: true },
          { title: 'All Domains', path: '/inventory/domains' },
          { title: 'All Vulnerabilities', path: '/inventory/vulnerabilities' }
        ]}
      ></Subnav>
      <br></br>
      <Table<Domain>
        renderPagination={renderPagination}
        tableRef={tableRef}
        columns={columns}
        data={domains}
        pageCount={Math.ceil(totalResults / PAGE_SIZE)}
        fetchData={fetchDomains}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};
