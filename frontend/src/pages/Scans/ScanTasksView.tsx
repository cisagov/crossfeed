import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance, Column } from 'react-table';
import { Query } from 'types';
import { Table, Paginator } from 'components';
import { ScanTask } from 'types';
import { useAuthContext } from 'context';
import { useHistory } from 'react-router-dom';
import { parse } from 'query-string';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ApiResponse {
  result: ScanTask[];
  count: number;
}

const dateAccessor = (date?: string) => {
  return !date || new Date(date).getTime() === new Date(0).getTime()
    ? 'Never'
    : `${formatDistanceToNow(parseISO(date))} ago`;
};

export const ScanTasksView: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const columns: Column<ScanTask>[] = [
    {
      Header: 'ID',
      accessor: 'id',
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: 'status',
      disableFilters: true
    },
    {
      Header: 'Type',
      accessor: 'type',
      disableFilters: true
    },
    {
      Header: 'Name',
      accessor: ({ scan }) => scan?.name,
      disableFilters: true
    },
    {
      Header: 'Created At',
      accessor: ({ createdAt }) => dateAccessor(createdAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Requested At',
      accessor: ({ requestedAt }) => dateAccessor(requestedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Started At',
      accessor: ({ startedAt }) => dateAccessor(startedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Finished At',
      accessor: ({ finishedAt }) => dateAccessor(finishedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Output',
      accessor: 'output',
      disableFilters: true
    }
  ];
  const PAGE_SIZE = 25;

  const fetchScanTasks = useCallback(
    async (query: Query<ScanTask>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>(
          '/scan-tasks/search',
          {
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
          }
        );
        setScanTasks(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<ScanTask>) => (
    <Paginator table={table} />
  );

  return (
    <>
      <Table<ScanTask>
        renderPagination={renderPagination}
        columns={columns}
        data={scanTasks}
        pageCount={pageCount}
        fetchData={fetchScanTasks}
        count={count}
        pageSize={PAGE_SIZE}
      />
    </>
  );
};

export default ScanTasksView;
