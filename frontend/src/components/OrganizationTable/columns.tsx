import React from 'react';
import { Column, CellProps } from 'react-table';
import { Link } from 'react-router-dom';
import { ColumnFilter, BooleanColumnFilter } from 'components';
import { Organization } from 'types';

import classes from './styles.module.scss';

type CreateColumns = () => Column<Organization>[];

export const createColumns: CreateColumns = () => [
  {
    Header: 'Name',
    Cell: ({ row: { original } }: CellProps<Organization>) => (
      <span>
        <Link to={`/organizations/${original.id}`}>{original.name}</Link>
        <i className={`${classes.memberCount} text-primary-darker`}>
          ({original.userRoles ? original.userRoles.length : 'no'} members)
        </i>
      </span>
    ),
    accessor: 'name',
    id: 'name',
    Filter: ColumnFilter
  },
  {
    Header: 'Root Domains',
    accessor: ({ rootDomains }) =>
      rootDomains.map((rootDomain) => rootDomain).join(', '),
    id: 'rootDomains',
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
      <input
        type="checkbox"
        checked={original.isPassive}
        readOnly={true}
      ></input>
    ),
    accessor: 'isPassive',
    id: 'isPassive',
    Filter: BooleanColumnFilter
  }
];
