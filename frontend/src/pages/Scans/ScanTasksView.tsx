import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance, Column } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, ColumnFilter, selectFilter } from 'components';
import { ScanTask } from 'types';
import { useAuthContext } from 'context';
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
      Filter: ColumnFilter,
      disableSortBy: true,
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: 'status',
      Filter: selectFilter([
        'created',
        'requested',
        'started',
        'finished',
        'failed'
      ]),
      disableSortBy: true
    },
    {
      Header: 'Name',
      id: 'name',
      accessor: ({ scan }) => scan?.name,
      Filter: selectFilter([
        'censys',
        'amass',
        'findomain',
        'portscanner',
        'wappalyzer',
        'censysIpv4'
      ]),
      disableSortBy: true
    },
    {
      Header: 'Created At',
      id: 'createdAt',
      accessor: ({ createdAt }) => dateAccessor(createdAt),
      disableFilters: true
    },
    {
      Header: 'Finished At',
      id: 'finishedAt',
      accessor: ({ finishedAt }) => dateAccessor(finishedAt),
      disableFilters: true
    },
    {
      Header: 'Output',
      accessor: 'output',
      disableFilters: true,
      maxWidth: 200,
      Cell: ({ value }: { value: string }) => (
        <pre
          style={{
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </pre>
      )
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: { row: { index: number; original: ScanTask } }) => (
        <>
          {row.original.status !== 'finished' && (
            <a href="#" onClick={() => null}>
              Kill
            </a>
          )}
        </>
      ),
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
