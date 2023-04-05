import React, { useState, useMemo } from 'react';
import { Chip, makeStyles } from '@material-ui/core';

interface Props {
  placeholder?: string;
  values: string[];
  onAddTag(value: string): void;
  onRemoveTag(value: string): void;
}

export const TaggedArrayInput: React.FC<Props> = (props) => {
  const { values, onAddTag, onRemoveTag, placeholder = ''} = props;
  const [inpValue, setInpValue] = useState('');
  const classes = useStyles();

  const error = useMemo(
    () => (values.includes(inpValue) ? 'Filters must be unique' : ''),
    [values, inpValue]
  );

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (!error && inpValue !== '') {
      onAddTag(inpValue);
      setInpValue('');
    }
  };

  const onRemove = (key: string) => {
    onRemoveTag(key);
  };

  const onInpChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    e.persist();
    setInpValue(e.target.value);
  };

  return (
    <form onSubmit={onSubmit} className={classes.form}>
      <input
        className={classes.inp}
        value={inpValue}
        onChange={onInpChange}
        aria-label="Filter"
        placeholder={placeholder}
      />
      {error && <span className={classes.error}>{error}</span>}
      <div className={classes.tagsWrapper}>
        {values.map((val) => (
          <div key={val}>
            <Chip
              classes={{ root: classes.chip }}
              label={val}
              onDelete={() => onRemove(val)}
            />
          </div>
        ))}
      </div>
    </form>
  );
};

const useStyles = makeStyles((theme) => ({
  form: {
    width: '100%',
    background: 'none'
  },
  inp: {
    border: 'none',
    backgroundColor: '#fff',
    width: '100%',
    padding: '1rem',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px #FFF, 0 1px 0 #FFF'
  },
  chip: {
    margin: '2px 0'
  },
  tagsWrapper: {
    display: 'block',
    margin: '1rem 0'
  },
  error: {
    display: 'block',
    margin: 0,
    paddingTop: '0.2rem',
    color: theme.palette.error.light
  }
}));
