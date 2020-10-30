import React, { useState } from 'react';
import { TextInput } from '@trussworks/react-uswds';
import { ColumnInstance } from 'react-table';
import { FaTimes } from 'react-icons/fa';
import classes from './styles.module.scss';

interface Props {
  column: ColumnInstance;
}

export const ColumnFilter: React.FC<Props> = ({
  column: { filterValue, setFilter, id }
}) => {
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
      />
      {filterValue && (
        <button type="button" className={classes.clearFilter} onClick={clear}>
          <FaTimes />
        </button>
      )}
    </form>
  );
};
