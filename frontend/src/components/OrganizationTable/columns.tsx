import React from 'react';
import { Column, CellProps } from 'react-table';
import { Link } from 'react-router-dom';
// @ts-ignore:next-line
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaSearch } from 'react-icons/fa';
import { ColumnFilter } from 'components';
import { Organization } from 'types';

type CreateColumns = () => Column<Organization>[];

export const createColumns: CreateColumns = () => [
  {
    Header: 'Details',
    Cell: ({ row: { original } }: CellProps<Organization>) => (
      <Link to={`/organizations/${original.id}`}>
        <FaSearch className="margin-x-auto display-block" />
      </Link>
    )
  },
  {
    Header: 'Name',
    accessor: 'name',
    id: 'name',
    Filter: ColumnFilter
  }
];
