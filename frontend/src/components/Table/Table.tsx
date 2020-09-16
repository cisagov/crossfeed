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
  useFilters
} from 'react-table';
import { TableHead } from './TableHead';
import { TableBody } from './TableBody';
import classes from './styles.module.scss';

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  initialSortBy?: SortingRule<T>[];
  pageCount?: number;
  count?: number;
  pageSize?: number;
  fetchData?: (query: Query<T>) => void;
  disableFilters?: boolean;
  renderPagination?: (table: TableInstance<T>) => JSX.Element;
  renderExpanded?: (row: Row<T>) => JSX.Element;
  tableRef?: React.Ref<TableInstance<T>>;
}

export const Table = <T extends object>(props: TableProps<T>) => {
  const {
    columns,
    data,
    initialSortBy,
    pageCount = 0,
    pageSize = 20,
    count,
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
      count,
      stateReducer,
      initialState: {
        sortBy: initialSortBy ?? [],
        pageSize,
        pageIndex: 0,
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
        filters
      });
  }, [fetchData, sortBy, filters, pageIndex]);

  return (
    <div className={classes.root}>
      <div className={classes.tableWrapper}>
        <div className={classes.tableInner}>
          <UsaTable {...instance.getTableProps()} bordered={true}>
            <TableHead<T> {...instance} />
            <TableBody<T> {...instance} renderExpanded={renderExpanded} />
          </UsaTable>
        </div>
        {renderPagination && renderPagination(instance)}
        {count ? (
          <p className="text-center">
            Showing {pageIndex * pageSize + 1}-
            {Math.min(count, (pageIndex + 1) * pageSize)} of {count}
          </p>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};
