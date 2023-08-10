import React from 'react';
import { Dropdown } from '@trussworks/react-uswds';
import { ColumnInstance } from 'react-table';
import classes from './styles.module.scss';

interface Props<T extends object> {
  column: ColumnInstance<T>;
}

type Option = { value: any; label: string };

export const selectFilter = <T extends object>(opts: string[] | Option[]) => {
  const SelectFilter: React.FC<Props<T>> = ({
    column: { filterValue, setFilter, id }
  }) => {
    return (
      <div className={classes.root}>
        <Dropdown
          id={id}
          name={id}
          value={filterValue}
          onChange={(e) => {
            setFilter(e.target.value);
          }}
        >
          <option value=""></option>
          {(opts as any[]).map((opt) => (
            <option
              key={(opt as Option).value || opt}
              value={(opt as Option).value || opt}
            >
              {(opt as Option).label || opt}
            </option>
          ))}
        </Dropdown>
      </div>
    );
  };

  return SelectFilter;
};
