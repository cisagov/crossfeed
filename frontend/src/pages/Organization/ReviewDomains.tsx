import React, { useState, useCallback, useEffect } from 'react';
import { Table, Paginator, ColumnFilter } from 'components';
import { Domain } from 'types';
import { parseISO, format, formatDistanceToNow, isAfter } from 'date-fns';
import { CellProps, Column, TableInstance } from 'react-table';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Query } from 'types';
import { useAuthContext } from 'context';
import { Button } from '@trussworks/react-uswds';

interface ApiResponse {
  result: Domain[];
  count: number;
}

const ReviewDomains = () => {
  const { currentOrganization, apiPost } = useAuthContext();
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const PAGE_SIZE = 25;

  const fetchDomains = useCallback(
    async (query: Query<Domain>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>('/domain/search', {
          body: {
            page,
            sort: sort[0]?.id ?? 'name',
            order: sort[0]?.desc ? 'DESC' : 'ASC',
            filters: {
              organization: currentOrganization!.id,
              status: 'pending'
            }
          }
        });
        console.error(result);
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost, currentOrganization]
  );

  const changeStatusDomains = useCallback(
    async (indexes: number[], status: string) => {
      await apiPost(`/domain/update-status`, {
        body: {
          ids: indexes.map(i => domains![i].id),
          status
        }
      });
      // Remove domains from table
      setDomains(domains!.filter((e, i) => indexes.indexOf(i) === -1));
    },
    [apiPost, domains, setDomains]
  );

  const approveDomains = async (indexes: number[]) =>
    changeStatusDomains(indexes, 'approved');
  const disavowDomains = async (indexes: number[]) =>
    changeStatusDomains(indexes, 'disavowed');

  const columns: Column<Domain>[] = [
    {
      Header: 'Details',
      Cell: ({ row: { original } }: CellProps<Domain>) => (
        <Link to={`/domain/${original.id}`}>
          <FaSearch className="margin-x-auto display-block" />
        </Link>
      )
    },
    {
      Header: 'Domain',
      accessor: 'name',
      id: 'reverseName',
      disableFilters: true
    },
    {
      Header: 'IP',
      accessor: 'ip',
      disableSortBy: true,
      disableFilters: true
    },
    {
      Header: 'Discovered',
      id: 'createdAt',
      accessor: ({ createdAt }) =>
        `${formatDistanceToNow(parseISO(createdAt))} ago`,
      disableFilters: true
    },
    {
      Header: 'Actions',
      id: 'actions',
      disableFilters: true,
      disableSortBy: true,
      accessor: e => null,
      Cell: ({ row }: { row: { index: number; original: Domain } }) => (
        <>
          <Button
            type="button"
            outline
            size="small"
            onClick={() => approveDomains([row.index])}
          >
            Approve
          </Button>
          <Button
            type="button"
            secondary
            size="small"
            onClick={() => disavowDomains([row.index])}
          >
            Disavow
          </Button>
        </>
      )
    }
  ];

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator table={table} />
  );

  const allIndexes = Object.keys(domains ?? []).map(e => Number(e));

  if (domains && domains.length === 0) {
    return (
      <>
        <h1>Review pending domains</h1>
        <p>There are no pending domains needing to be reviewed at this time.</p>
      </>
    );
  }
  return (
    <>
      <h1>Review pending domains</h1>
      <Button
        type="button"
        outline
        size="small"
        onClick={() => approveDomains(allIndexes)}
      >
        Approve all
      </Button>
      <Button
        type="button"
        secondary
        size="small"
        onClick={() => disavowDomains(allIndexes)}
      >
        Disavow all
      </Button>
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains ?? []}
        pageCount={pageCount}
        fetchData={fetchDomains}
        count={count}
        pageSize={PAGE_SIZE}
      />
    </>
  );
};

export default ReviewDomains;
