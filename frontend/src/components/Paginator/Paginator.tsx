import React, { PropsWithChildren } from 'react';
import { TableInstance } from 'react-table';
import { Button, makeStyles, Paper } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';

interface PaginatorProps<T extends object> {
  table: TableInstance<T>;
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
    state: { pageIndex: idx }
  }
}: PropsWithChildren<PaginatorProps<T>>) => {
  const classes = useStyles();

  return (
    <Paper classes={{ root: classes.pagination }}>
      <span>
        <strong>
          {pageCount === 0 ? 0 : idx * 15} -{' '}
          {Math.min(idx * 15 + 15, pageCount * 15)}
        </strong>{' '}
        of <strong>{pageCount * 15}</strong>
      </span>
      <Pagination
        count={pageCount}
        page={idx}
        onChange={(_, page) => {
          gotoPage(page);
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
