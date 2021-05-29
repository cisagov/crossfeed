import React, { PropsWithChildren } from 'react';
import { TableInstance, Row } from 'react-table';
import classes from './styles.module.scss';

interface TableBodyProps<T extends object> extends TableInstance<T> {
  renderExpanded?: (row: Row<T>) => JSX.Element;
}

export const TableBody = <T extends object>({
  rows,
  prepareRow,
  visibleColumns,
  getTableBodyProps,
  renderExpanded
}: PropsWithChildren<TableBodyProps<T>>) => {
  return (
    <tbody {...getTableBodyProps()}>
      {rows.map((row) => {
        prepareRow(row);
        const { key, ...rest } = row.getRowProps();
        return (
          <React.Fragment key={key}>
            <tr {...rest}>
              {row.cells.map((cell) => {
                const { key, ...rest } = cell.getCellProps();
                return (
                  <td key={key} {...rest} className={classes.td}>
                    <div style={{ maxHeight: 50 }}>{cell.render('Cell')}</div>
                  </td>
                );
              })}
            </tr>
            {row.isExpanded && renderExpanded ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className={classes.subComponentTd}
                >
                  {renderExpanded(row)}
                </td>
              </tr>
            ) : null}
          </React.Fragment>
        );
      })}
    </tbody>
  );
};
