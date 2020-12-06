import React, { PropsWithChildren } from 'react';
import { TableInstance } from 'react-table';
import { Button, makeStyles, Paper } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';

interface PaginatorProps<T extends object> {
  table: TableInstance<T>;
  totalResults: number;
}

const useStyles = makeStyles((theme) => ({
  pagination: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  }
}));

export const Paginator = <T extends object>({
  table: {
    pageCount,
    gotoPage,
    state: { pageIndex, pageSize }
  },
  totalResults
}: PropsWithChildren<PaginatorProps<T>>) => {
  const classes = useStyles();

  return (
    <Paper classes={{ root: classes.pagination }}>
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
      <Button style={{ right: '5rem', position: 'absolute' }}>
        Export Results
      </Button>
    </Paper>
  );
};
