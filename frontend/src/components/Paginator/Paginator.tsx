import React, { PropsWithChildren } from 'react';
import { classes, StyledPaper } from './paginatorStyle';
import { TableInstance } from 'react-table';
import { Button } from '@mui/material';
import { Pagination } from '@mui/material';
import { exportCSV, ExportProps } from 'components/ImportExport';
import { useAuthContext } from 'context';

interface PaginatorProps<T extends object> {
  table: TableInstance<T>;
  totalResults: number;
  export?: ExportProps<T>;
}

export const Paginator = <T extends object>(
  props: PropsWithChildren<PaginatorProps<T>>
) => {
  const { setLoading } = useAuthContext();

  const {
    table: {
      pageCount,
      gotoPage,
      state: { pageIndex, pageSize }
    },
    totalResults
  } = props;
  return (
    <StyledPaper classes={{ root: classes.pagination }}>
      <span>
        <strong>
          {pageCount === 0 ? 0 : pageIndex * pageSize + 1} -{' '}
          {Math.min(pageIndex * pageSize + pageSize, totalResults)}
        </strong>{' '}
        of <strong>{totalResults}</strong>
      </span>
      <Pagination
        count={pageCount}
        page={pageIndex + 1}
        onChange={(_, page) => {
          gotoPage(page - 1);
        }}
        color="primary"
        size="small"
      />
      {props.export && (
        <Button
          className={classes.exportButton}
          onClick={() => props.export && exportCSV(props.export, setLoading)}
        >
          Export Results
        </Button>
      )}
    </StyledPaper>
  );
};
