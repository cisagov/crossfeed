import React, { PropsWithChildren } from 'react';
import { TableInstance } from 'react-table';
import { Button, Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { Pagination } from '@mui/material';
import { exportCSV, ExportProps } from 'components/ImportExport';
import { useAuthContext } from 'context';

interface PaginatorProps<T extends object> {
  table: TableInstance<T>;
  totalResults: number;
  export?: ExportProps<T>;
}

const useStyles = makeStyles((theme) => ({
  pagination: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    },
    width: '100%',
    justifyContent: 'flex-start'
  },
  exportButton: {
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  }
}));

export const Paginator = <T extends object>(
  props: PropsWithChildren<PaginatorProps<T>>
) => {
  const { setLoading } = useAuthContext();
  const classes = useStyles();
  const {
    table: {
      pageCount,
      gotoPage,
      state: { pageIndex, pageSize }
    },
    totalResults
  } = props;
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
      {props.export && (
        <Button
          className={classes.exportButton}
          onClick={() => props.export && exportCSV(props.export, setLoading)}
        >
          Export Results
        </Button>
      )}
    </Paper>
  );
};
