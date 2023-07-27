import React, { PropsWithChildren } from 'react';
import { styled } from '@mui/material/styles';
import { TableInstance } from 'react-table';
import { Button, Paper } from '@mui/material';
import { Pagination } from '@mui/material';
import { exportCSV, ExportProps } from 'components/ImportExport';
import { useAuthContext } from 'context';

const PREFIX = 'Paginator';

const classes = {
  pagination: `${PREFIX}-pagination`,
  exportButton: `${PREFIX}-exportButton`
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  [`& .${classes.pagination}`]: {
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

  [`& .${classes.exportButton}`]: {
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  }
}));

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
