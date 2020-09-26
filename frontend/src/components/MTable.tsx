import React from 'react';
import { TableInstance } from 'react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  makeStyles,
  TableProps
} from '@material-ui/core';

interface Props<T extends object> extends TableProps {
  instance: TableInstance<T>;
  footerRows?: React.ReactNode;
}

export const MTable = <T extends object>(props: Props<T>) => {
  const { instance, footerRows, ...rest } = props;
  const classes = useStyles();

  return (
    <Table {...instance.getTableProps} {...rest}>
      <TableHead classes={{ root: classes.head }}>
        {instance.headerGroups.map(group => (
          <TableRow {...group.getHeaderGroupProps()}>
            {group.headers.map(column => (
              <TableCell
                {...column.getHeaderProps()}
                classes={{ root: classes.cell }}
              >
                {column.render('Header')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...instance.getTableBodyProps()}>
        {instance.rows.map(row => {
          instance.prepareRow(row);
          const { key, ...rest } = row.getRowProps();
          return (
            <React.Fragment key={key}>
              <TableRow {...rest}>
                {row.cells.map(cell => (
                  <TableCell
                    {...cell.getCellProps()}
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
    </Table>
  );
};

const useStyles = makeStyles(theme => ({
  head: {
    backgroundColor: '#E8EAEC'
  },
  cell: {
    fontSize: '1rem'
  }
}));
