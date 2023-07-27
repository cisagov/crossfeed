import React from 'react';
import { styled } from '@mui/material/styles';
import { TableInstance } from 'react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TableProps
} from '@mui/material';

const PREFIX = 'MTable';

const classes = {
  head: `${PREFIX}-head`,
  cell: `${PREFIX}-cell`
};

const StyledTable = styled(Table)(({ theme }) => ({
  [`& .${classes.head}`]: {
    backgroundColor: '#E8EAEC'
  },

  [`& .${classes.cell}`]: {
    fontSize: '1rem'
  }
}));

interface Props<T extends object> extends TableProps {
  instance: TableInstance<T>;
  footerRows?: React.ReactNode;
}

export const MTable = <T extends object>(props: Props<T>) => {
  const { instance, footerRows, ...rest } = props;

  return (
    <StyledTable {...instance.getTableProps} {...rest}>
      <TableHead classes={{ root: classes.head }}>
        {instance.headerGroups.map((group) => (
          <TableRow {...group.getHeaderGroupProps()} key={group.id}>
            {group.headers.map((column) => (
              <TableCell
                {...column.getHeaderProps()}
                key={column.id}
                classes={{ root: classes.cell }}
              >
                {column.render('Header')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...instance.getTableBodyProps()}>
        {instance.rows.map((row) => {
          instance.prepareRow(row);
          const { key, ...rest } = row.getRowProps();
          return (
            <React.Fragment key={key}>
              <TableRow {...rest}>
                {row.cells.map((cell) => (
                  <TableCell
                    {...cell.getCellProps()}
                    key={`${cell.row},${cell.column}`}
                    classes={{ root: classes.cell }}
                  >
                    {cell.render('Cell')}
                  </TableCell>
                ))}
              </TableRow>
            </React.Fragment>
          );
        })}
      </TableBody>
      {footerRows && <TableFooter>{footerRows}</TableFooter>}
    </StyledTable>
  );
};
