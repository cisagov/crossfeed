import React, { useMemo, useState, useCallback } from 'react';
import { TableInstance, Row } from 'react-table';
import { Query } from 'types';
import { useAuthContext } from 'context';
import { Table, Paginator } from 'components';
import { createColumns } from './columns';
import { Vulnerability } from 'types';
import classes from './styles.module.scss';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
}

export const Vulnerabilities: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [pageCount, setPageCount] = useState(0);

  const columns = useMemo(() => createColumns(), []);

  const fetchDomains = useCallback(
    async (query: Query<Vulnerability>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>(
          '/vulnerabilities/search',
          {
            body: {
              page,
              sort: sort[0]?.id ?? 'createdAt',
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
          }
        );
        setVulnerabilities(result);
        setPageCount(Math.ceil(count / 25));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator table={table} />
  );

  const renderExpanded = useCallback((row: Row<Vulnerability>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        <h4>Description</h4>
        <div className={classes.desc}>{original.title}</div>
      </div>
    );
  }, []);

  return (
    <div className={classes.root}>
      <h1>Vulnerabilities</h1>
      <Table<Vulnerability>
        renderPagination={renderPagination}
        columns={columns}
        data={vulnerabilities}
        pageCount={pageCount}
        fetchData={fetchDomains}
        renderExpanded={renderExpanded}
      />
    </div>
  );
};

export default Vulnerabilities;
