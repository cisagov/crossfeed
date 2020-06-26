import React, { PropsWithChildren } from 'react';
import { TableInstance } from 'react-table';
import { PaginatorIndicatorIcon } from './PaginatorIndicatorIcon';
import { PaginatorButton } from './PaginatorButton';

interface PaginatorProps<T extends object> {
  table: TableInstance<T>;
}

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

  return (
    <div className="grid-row flex-justify-center margin-top-4">
      <PaginatorButton onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        <PaginatorIndicatorIcon left />
        <PaginatorIndicatorIcon left pad />
        First
      </PaginatorButton>
      <PaginatorButton
        onClick={() => previousPage()}
        disabled={!canPreviousPage}
      >
        <PaginatorIndicatorIcon left pad />
        Previous
      </PaginatorButton>
      {Array.from({ length: listSize }).map((_, i) => {
        const pageNum = i + startIdx;
        return (
          <PaginatorButton
            isPageNumber
            active={pageNum === idx}
            key={pageNum}
            onClick={() => gotoPage(pageNum)}
          >
            {pageNum + 1}
          </PaginatorButton>
        );
      })}
      <PaginatorButton onClick={nextPage} disabled={!canNextPage}>
        Next
        <PaginatorIndicatorIcon pad />
      </PaginatorButton>
      <PaginatorButton
        onClick={() => gotoPage(pageCount - 1)}
        disabled={!canNextPage}
      >
        Last
        <PaginatorIndicatorIcon pad />
        <PaginatorIndicatorIcon />
      </PaginatorButton>
    </div>
  );
};
