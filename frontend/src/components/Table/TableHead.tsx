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
    {headerGroups.map((headerGroup) => {
      const { key, ...rest } = headerGroup.getHeaderGroupProps();
      return (
        <React.Fragment key={key}>
          <tr {...rest}>
            {headerGroup.headers.map((column, index) => {
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
                </th>
              );
            })}
          </tr>
          {headerGroup.headers.find((column) => column.canFilter) && (
            <tr {...rest}>
              {headerGroup.headers.map((column) => {
                const { key, ...rest } = column.getHeaderProps();
                return (
                  <th {...rest} key={key} className={classes.thFilter}>
                    <div>
                      {column.canFilter ? column.render('Filter') : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          )}
        </React.Fragment>
      );
    })}
  </thead>
);
