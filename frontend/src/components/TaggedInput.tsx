import React, { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { Chip } from '@mui/material';

const PREFIX = 'TaggedArrayInput';

const classes = {
  form: `${PREFIX}-form`,
  inp: `${PREFIX}-inp`,
  chip: `${PREFIX}-chip`,
  tagsWrapper: `${PREFIX}-tagsWrapper`,
  error: `${PREFIX}-error`
};

const Root = styled('form')(({ theme }) => ({
  [`&.${classes.form}`]: {
    width: '100%',
    background: 'none'
  },

  [`& .${classes.inp}`]: {
    border: 'none',
    backgroundColor: '#fff',
    width: '100%',
    padding: '1rem',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px #FFF, 0 1px 0 #FFF'
  },

  [`& .${classes.chip}`]: {
    margin: '2px 0'
  },

  [`& .${classes.tagsWrapper}`]: {
    display: 'block',
    margin: '1rem 0'
  },

  [`& .${classes.error}`]: {
    display: 'block',
    margin: 0,
    paddingTop: '0.2rem',
    color: theme.palette.error.light
  }
}));

interface Props {
  placeholder?: string;
  values: string[];
  onAddTag(value: string): void;
  onRemoveTag(value: string): void;
}

export const TaggedArrayInput: React.FC<Props> = (props) => {
  const { values, onAddTag, onRemoveTag, placeholder = '' } = props;
  const [inpValue, setInpValue] = useState('');

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
    <Root onSubmit={onSubmit} className={classes.form}>
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
    </Root>
  );
};
