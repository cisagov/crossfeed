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
    Header: 'Name',
    Cell: ({ row: { original } }: CellProps<Organization>) => (
      <Link to={`/organizations/${original.id}`}>{original.name}</Link>
    ),
    accessor: 'name',
    id: 'name',
    Filter: ColumnFilter
  },
  {
    Header: 'Root Domains',
    accessor: ({ rootDomains }) =>
      rootDomains.map((rootDomain) => rootDomain).join(', '),
    id: 'rootDomain',
    Filter: ColumnFilter
  },
  {
    Header: 'Tags',
    accessor: ({ tags }) => tags.map((tag) => tag.name).join(', '),
    id: 'tags',
    Filter: ColumnFilter
  },
  {
    Header: 'IP Blocks',
    accessor: ({ ipBlocks }) => ipBlocks.map((ipBlock) => ipBlock).join(', '),
    id: 'ipBlocks',
    Filter: ColumnFilter
  },
  {
    Header: 'Passive',
    Cell: ({ row: { original } }: CellProps<Organization>) => (
      <input type="checkbox" checked={original.isPassive}></input>
    ),
    accessor: 'isPassive',
    id: 'isPassive',
    disableFilters: true
  }
];
