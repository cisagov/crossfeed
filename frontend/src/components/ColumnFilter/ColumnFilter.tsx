import React, { useState } from 'react';
import { TextInput } from '@trussworks/react-uswds';
import { ColumnInstance } from 'react-table';
import { FaSearch, FaTimes } from 'react-icons/fa';
import classes from './styles.module.scss';

interface Props<T extends object> {
  column: ColumnInstance<T>;
}

export const ColumnFilter = <T extends object>({
  column: { filterValue, setFilter, id }
}: Props<T>) => {
  const [search, setSearch] = useState('');

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    setFilter(search);
  };

  const clear: React.MouseEventHandler = (e) => {
    setSearch('');
    setFilter('');
  };

  return (
    <form onSubmit={onSubmit} className={classes.root}>
      <TextInput
        id={id}
        name={id}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        className={classes.input}
      />
      <FaSearch className={classes.searchIcon}></FaSearch>
      {filterValue && (
        <button type="button" className={classes.clearFilter} onClick={clear}>
          <FaTimes />
        </button>
      )}
    </form>
  );
};
