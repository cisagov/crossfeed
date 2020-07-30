import React from 'react';
import { Column, CellProps } from 'react-table';
import { Vulnerability } from 'types';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ColumnFilter, selectFilter } from 'components';

type CreateColumns = () => Column<Vulnerability>[];

export const createColumns: CreateColumns = () => [
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
  },
  {
    Header: 'Created',
    id: 'created',
    accessor: ({ created }) => `${formatDistanceToNow(parseISO(created))} ago`,
    width: 250,
    disableFilters: true
  },
  {
    Header: 'Severity',
    accessor: 'severity',
    width: 100,
    Filter: selectFilter([
      'low',
      'medium',
      'high',
      'critical',
      'none',
      'unknown'
    ])
  },
  {
    Header: 'State',
    accessor: 'state',
    width: 100,
    Filter: selectFilter([
      'duplicate',
      'informative',
      'needs-more-info',
      'new',
      'not-applicable',
      'resolved',
      'spam',
      'triaged'
    ])
  },
  {
    Header: 'Title',
    accessor: 'title',
    width: 800,
    Filter: ColumnFilter
  }
];
