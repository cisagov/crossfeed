import React, { useEffect, useImperativeHandle } from 'react';
import { Table as UsaTable } from '@trussworks/react-uswds';
import { Query } from 'types';
import {
  useTable,
  useExpanded,
  Column,
  useSortBy,
  SortingRule,
  usePagination,
  TableInstance,
  Row,
  useFilters,
  Filters
} from 'react-table';
import { TableHead } from './TableHead';
import { TableBody } from './TableBody';
import classes from './styles.module.scss';
import { NoResults } from '../NoResults';

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  initialSortBy?: SortingRule<T>[];
  initialFilterBy?: Filters<T>;
  pageCount?: number;
  pageSize?: number;
  fetchData?: (query: Query<T>) => void;
  disableFilters?: boolean;
  renderPagination?: (table: TableInstance<T>) => JSX.Element;
  renderExpanded?: (row: Row<T>) => JSX.Element;
  tableRef?: React.Ref<TableInstance<T>>;
  noResults?: boolean;
  noResultsMessage?: string;
}

export const Table = <T extends object>(props: TableProps<T>) => {
  const {
    columns,
    data,
    initialSortBy,
    initialFilterBy,
    pageCount = 0,
    pageSize = 20,
    fetchData,
    disableFilters = false,
    renderPagination,
    renderExpanded,
    tableRef
  } = props;

  const stateReducer = (nextState: any, action: any, prevState: any) => {
    if (action.type === 'toggleSortBy' || action.type === 'setGlobalFilter') {
      return { ...nextState, pageIndex: 0 };
    }
    return nextState;
  };

  const instance = useTable(
    {
      columns,
      data,
      disableMultiSort: true,
      manualSortBy: Boolean(fetchData),
      manualPagination: Boolean(fetchData),
      manualFilters: Boolean(fetchData),
      autoResetSortBy: false,
      disableFilters,
      pageCount,
      stateReducer,
      initialState: {
        sortBy: initialSortBy ?? [],
        pageSize,
        pageIndex: 0,
        filters: initialFilterBy ?? [],
        globalFilter: []
      }
    },
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  useImperativeHandle(tableRef, () => instance);

  const {
    state: { sortBy, pageIndex, filters }
  } = instance;

  useEffect(() => {
    fetchData &&
      fetchData({
        sort: sortBy,
        page: pageIndex + 1,
        pageSize,
        filters
      });
  }, [fetchData, sortBy, filters, pageIndex, pageSize]);

  return (
    <div className={classes.root}>
      <div className={classes.tableInner}>
        <UsaTable {...instance.getTableProps()} bordered={false}>
          <TableHead<T> {...instance} />
          <TableBody<T> {...instance} renderExpanded={renderExpanded} />
        </UsaTable>
      </div>
      {props.noResults && (
        <NoResults message={props.noResultsMessage!}></NoResults>
      )}
      {renderPagination && renderPagination(instance)}
    </div>
  );
};
