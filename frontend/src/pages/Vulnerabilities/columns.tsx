import React from 'react';
import { Column, CellProps } from 'react-table';
import { Vulnerability } from 'types';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ColumnFilter, selectFilter } from 'components';
import { Link } from 'react-router-dom';

type CreateColumns = () => Column<Vulnerability>[];

export const createColumns: CreateColumns = () => [
  {
    Header: 'Title',
    accessor: 'title',
    width: 800,
    Filter: ColumnFilter
  },
  {
    Header: 'Domain',
    id: 'domain',
    accessor: ({ domain }) => (
      <Link to={`/domain/${domain.id}`}>{domain?.name}</Link>
    ),
    width: 800,
    Filter: ColumnFilter
  },
  {
    Header: 'Severity',
    id: 'severity',
    accessor: ({ severity }) => severity,
    width: 100,
    Filter: selectFilter(['Low', 'Medium', 'High', 'Critical', 'None'])
  },
  {
    Header: 'Created',
    id: 'created',
    accessor: ({ createdAt }) =>
      `${formatDistanceToNow(parseISO(createdAt))} ago`,
    width: 250,
    disableFilters: true
  },
  {
    Header: 'State',
    id: 'state',
    accessor: 'state',
    width: 100,
    Filter: selectFilter(['open', 'closed'])
  },
  {
    Header: 'Details',
    Cell: ({ row }: CellProps<Vulnerability>) => (
      <span
        {...row.getToggleRowExpandedProps()}
        className="text-center display-block"
      >
        {row.isExpanded ? <FaMinus /> : <FaPlus />}
      </span>
    ),
    disableFilters: true
  }
];
