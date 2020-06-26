import React from 'react';
import { Column, CellProps } from 'react-table';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaSearch } from 'react-icons/fa';
import { ColumnFilter } from 'components';
import { Domain } from 'types';

type CreateColumns = () => Column<Domain>[];

export const createColumns: CreateColumns = () => [
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
    Filter: ColumnFilter
  },
  {
    Header: 'IP',
    accessor: 'ip',
    Filter: ColumnFilter
  },
  {
    Header: 'Ports',
    id: 'port',
    disableSortBy: true,
    accessor: 'ports',
    Filter: ColumnFilter
  },
  {
    Header: 'Services',
    id: 'services',
    disableSortBy: true,
    accessor: 'web_frameworks', //For now show web frameworks until we get services
    Filter: ColumnFilter
  },
  {
    Header: 'Updated',
    id: 'updatedAt',
    accessor: ({ updatedAt }) =>
      `${formatDistanceToNow(parseISO(updatedAt))} ago`,
    disableFilters: true
  }
];
