import React, { useMemo } from 'react';
import {
  useTable,
  TableOptions,
  useGlobalFilter,
  useSortBy,
  useExpanded,
  usePagination,
  useFilters,
  Column,
  CellProps
} from 'react-table';
import { Link } from 'react-router-dom';
import { Domain } from 'types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaSearch } from 'react-icons/fa';

type CreateColumns = () => Column<Domain>[];

export const getServiceNames = (domain: Domain) => {
  const allServices = new Set();
  for (const service of domain.services) {
    for (const product of service.products) {
      allServices.add(
        product.name + (product.version ? ` ${product.version}` : '')
      );
    }
  }
  return Array.from(allServices).join(', ');
};

const createColumns: CreateColumns = () => [
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
    id: 'reverseName'
  },
  {
    Header: 'IP',
    accessor: 'ip',
    id: 'ip'
  },
  {
    Header: 'Ports',
    id: 'port',
    disableSortBy: true,
    accessor: ({ services }) => services.map(service => service.port).join(', ')
  },
  {
    Header: 'Services',
    id: 'services',
    disableSortBy: true,
    accessor: domain => getServiceNames(domain)
  },
  {
    Header: 'Vulnerabilities',
    id: 'vulnerabilities',
    accessor: domain =>
      domain.vulnerabilities &&
      domain.vulnerabilities.map(vulnerability => vulnerability.cve).join(', ')
  },
  {
    Header: 'Updated',
    id: 'updatedAt',
    accessor: ({ updatedAt }) =>
      `${formatDistanceToNow(parseISO(updatedAt))} ago`,
    disableFilters: true
  }
];

export const useDashboardTable = (
  data: Domain[],
  opts: Partial<TableOptions<Domain>>
) => {
  const columns = useMemo(() => createColumns(), []);

  const stateReducer = (nextState: any, action: any, prevState: any) => {
    if (action.type === 'toggleSortBy' || action.type === 'setGlobalFilter') {
      return { ...nextState, pageIndex: 0 };
    }
    return nextState;
  };

  const instance = useTable<Domain>(
    {
      columns,
      data,
      disabledMultiRemove: true,
      disableMultiSort: true,
      manualSortBy: true,
      manualPagination: true,
      manualFilters: true,
      autoResetSortBy: false,
      stateReducer,
      ...opts
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  return instance;
};
