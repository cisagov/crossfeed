import React from 'react';
import { Column, CellProps } from 'react-table';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Service } from 'types';
import { FaMinus, FaPlus } from 'react-icons/fa';

export const columns: Column<Service>[] = [
  {
    Header: 'Details',
    Cell: ({ row }: CellProps<Service>) => (
      <span {...row.getToggleRowExpandedProps()}>
        {row.isExpanded ? <FaMinus /> : <FaPlus />}
      </span>
    )
  },
  {
    Header: 'Last Seen',
    accessor: ({ lastSeen }) =>
      `${formatDistanceToNow(parseISO(lastSeen || ''))} ago`
  },
  {
    Header: 'Port',
    accessor: 'port'
  },
  {
    Header: 'Service',
    accessor: 'service'
  },
  {
    Header: 'Product',
    accessor: e => e.censysMetadata?.product
  },
  {
    Header: 'Version',
    accessor: e => e.censysMetadata?.version
  },
  {
    Header: 'Description',
    accessor: e => e.censysMetadata?.description
  }
];
