import React, { PropsWithChildren } from 'react';
import { TableInstance } from 'react-table';
import { PaginatorIndicatorIcon } from './PaginatorIndicatorIcon';
import { PaginatorButton } from './PaginatorButton';
import classes from '*.module.css';
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
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    pageCount,
    gotoPage,
    state: { pageIndex: idx }
  }
}: PropsWithChildren<PaginatorProps<T>>) => {
  const startIdx = idx >= 2 ? idx - 2 : 0;
  const endIdx = idx <= pageCount - 3 ? idx + 3 : pageCount;
  const listSize = endIdx - startIdx;
  const classes = useStyles();

  return (
    <Paper classes={{ root: classes.pagination }}>
      <span>
        <strong>
          {pageCount === 0 ? 0 : idx * 10 + 1} -{' '}
          {Math.min(idx * 10 + 10, pageCount * 10)}
        </strong>{' '}
        of <strong>{pageCount * 10}</strong>
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

  // return (
  //   <div className="grid-row flex-justify-center margin-top-4">
  //     <PaginatorButton onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
  //       <PaginatorIndicatorIcon left />
  //       <PaginatorIndicatorIcon left pad />
  //       First
  //     </PaginatorButton>
  //     <PaginatorButton
  //       onClick={() => previousPage()}
  //       disabled={!canPreviousPage}
  //     >
  //       <PaginatorIndicatorIcon left pad />
  //       Previous
  //     </PaginatorButton>
  //     {Array.from({ length: listSize }).map((_, i) => {
  //       const pageNum = i + startIdx;
  //       return (
  //         <PaginatorButton
  //           isPageNumber
  //           active={pageNum === idx}
  //           key={pageNum}
  //           onClick={() => gotoPage(pageNum)}
  //         >
  //           {pageNum + 1}
  //         </PaginatorButton>
  //       );
  //     })}
  //     <PaginatorButton onClick={nextPage} disabled={!canNextPage}>
  //       Next
  //       <PaginatorIndicatorIcon pad />
  //     </PaginatorButton>
  //     <PaginatorButton
  //       onClick={() => gotoPage(pageCount - 1)}
  //       disabled={!canNextPage}
  //     >
  //       Last
  //       <PaginatorIndicatorIcon pad />
  //       <PaginatorIndicatorIcon />
  //     </PaginatorButton>
  //   </div>
  // );
};
