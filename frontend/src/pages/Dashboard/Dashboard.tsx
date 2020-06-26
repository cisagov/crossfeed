import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator } from 'components';
import { Domain } from 'types';
import { createColumns } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';

interface ApiResponse {
  result: Domain[];
  count: number;
}

export const Dashboard: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const columns = useMemo(() => createColumns(), []);

  const fetchDomains = useCallback(
    async (query: Query<Domain>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>('/domain/search', {
          body: {
            page,
            sort: sort[0]?.id ?? 'name',
            order: sort[0]?.desc ? 'DESC' : 'ASC',
            filters: filters
              .filter(f => Boolean(f.value))
              .reduce(
                (accum, next) => ({
                  ...accum,
                  [next.id]: next.value
                }),
                {}
              )
          }
        });
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / 25));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator table={table} />
  );

  return (
    <div className={classes.root}>
      <h1>Dashboard</h1>
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomains}
        count={count}
      />
    </div>
  );
};
