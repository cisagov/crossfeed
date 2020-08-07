import React from 'react';
import { Column, CellProps } from 'react-table';
import { Vulnerability } from 'types';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ColumnFilter, selectFilter } from 'components';

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
    accessor: ({ domain }) => domain.name,
    width: 800,
    Filter: ColumnFilter
  },
  {
    Header: 'Severity',
    accessor: ({ cvss }) => {
      if (!cvss) return;
      if (cvss < 4) {
        return 'Low';
      } else if (cvss < 7) {
        return 'Medium';
      } else if (cvss < 9) {
        return 'High';
      } else {
        return 'Critical';
      }
    },
    width: 100,
    disableFilters: true
    // Filter: selectFilter([
    //   'low',
    //   'medium',
    //   'high',
    //   'critical',
    //   'none',
    //   'unknown'
    // ])
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
