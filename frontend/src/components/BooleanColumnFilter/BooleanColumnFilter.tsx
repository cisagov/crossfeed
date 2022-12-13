import React, { useState } from 'react';
import { ColumnInstance } from 'react-table';
import { FaTimes } from 'react-icons/fa';
import classes from './styles.module.scss';

interface Props {
  column: ColumnInstance;
}

export const BooleanColumnFilter: React.FC<Props> = ({
  column: { filterValue, setFilter, id }
}) => {
  const [search, setSearch] = useState('');

  const onSubmit: React.FormEventHandler = (e) => {
    console.log(`I AM SETTING SEARCH ${search}`);
    e.preventDefault();
    setFilter(search);
  };

  const clear: React.MouseEventHandler = (e) => {
    setSearch('');
    setFilter('');
  };

  return (
    <form onSubmit={onSubmit} className={classes.root}>
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={search === 'true'}
        onChange={(e) => {
          console.log(e.target.checked.toString());
          setSearch(e.target.checked.toString());
          setFilter(e.target.checked.toString());
        }}
        className={classes.input}
      />
      {filterValue && (
        <button type="button" className={classes.clearFilter} onClick={clear}>
          <FaTimes />
        </button>
      )}
    </form>
  );
};
