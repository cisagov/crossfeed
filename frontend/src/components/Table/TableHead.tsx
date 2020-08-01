import React, { PropsWithChildren } from 'react';
import { HeaderGroup } from 'react-table';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import classes from './styles.module.scss';

interface TableHeadProps<T extends object> {
  headerGroups: HeaderGroup<T>[];
}

export const TableHead = <T extends object>({
  headerGroups
}: PropsWithChildren<TableHeadProps<T>>) => (
  <thead>
    {headerGroups.map(headerGroup => {
      const { key, ...rest } = headerGroup.getHeaderGroupProps();
      return (
        <tr {...rest} key={key}>
          {headerGroup.headers.map(column => {
            const { key, ...rest } = column.getHeaderProps();
            return (
              <th {...rest} key={key} className={classes.th}>
                <div
                  className="display-flex flex-justify flex-align-center flex-no-wrap text-no-wrap"
                  {...column.getSortByToggleProps()}
                >
                  {column.render('Header')}
                  {column.canSort && (
                    <div
                      className="margin-left-05"
                      style={{
                        visibility: column.isSorted ? 'visible' : 'hidden'
                      }}
                    >
                      {column.isSortedDesc ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronUp />
                      )}
                    </div>
                  )}
                </div>
                <div>{column.canFilter ? column.render('Filter') : null}</div>
              </th>
            );
          })}
        </tr>
      );
    })}
  </thead>
);
