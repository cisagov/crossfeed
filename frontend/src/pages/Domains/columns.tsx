import React from 'react';
import { Column, CellProps } from 'react-table';
import { Link } from 'react-router-dom';
// @ts-ignore:next-line
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaSearch } from 'react-icons/fa';
import { ColumnFilter } from 'components';
import { Domain } from 'types';

type CreateColumns = () => Column<Domain>[];

export const getServiceNames = (domain: Domain) => {
  const allServices: { [key: string]: string } = {};
  for (const service of domain.services) {
    for (const product of service.products) {
      if (product.name)
        allServices[product.name.toLowerCase()] =
          product.name + (product.version ? ` ${product.version}` : '');
    }
  }
  return Object.values(allServices).join(', ');
};

export const createColumns: CreateColumns = () => [
  {
    Header: 'Details',
    Cell: ({ row: { original } }: CellProps<Domain>) => (
      <Link to={`/inventory/domain/${original.id}`}>
        <FaSearch className="margin-x-auto display-block" />
      </Link>
    )
  },
  {
    Header: 'Organization',
    accessor: (e) => e.organization.name,
    id: 'organizationName',
    Filter: ColumnFilter
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
    accessor: ({ services }) =>
      services.map((service) => service.port).join(', '),
    Filter: ColumnFilter
  },
  {
    Header: 'Services',
    id: 'service',
    disableSortBy: true,
    accessor: (domain) => getServiceNames(domain),
    Filter: ColumnFilter
  },
  {
    Header: 'Vulnerabilities',
    id: 'vulnerability',
    accessor: (domain) =>
      domain.vulnerabilities &&
      domain.vulnerabilities
        .map((vulnerability) => vulnerability.cve)
        .join(', '),
    Filter: ColumnFilter
  },
  {
    Header: 'Last Seen',
    id: 'updatedAt',
    accessor: ({ updatedAt }) =>
      `${formatDistanceToNow(parseISO(updatedAt))} ago`,
    disableFilters: true
  },
  {
    Header: 'First Seen',
    id: 'createdAt',
    accessor: ({ createdAt }) =>
      `${formatDistanceToNow(parseISO(createdAt))} ago`,
    disableFilters: true
  }
];
