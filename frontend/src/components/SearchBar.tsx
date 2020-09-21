import React, { useState } from 'react';
import clsx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { SearchOutlined } from '@material-ui/icons';

interface Props extends Partial<JSX.IntrinsicElements['input']> {}

const defaultPlaceholder = 'Search for a domain, vuln type, port, service, IP';

export const SearchBar: React.FC<Props> = ({
  className,
  placeholder,
  ...rest
}) => {
  const [inpFocused, setInpFocused] = useState(false);
  const classes = useStyles({ inpFocused });

  return (
    <div className={classes.wrapper}>
      <div className={classes.inner}>
        <SearchOutlined className={classes.icon} />
        <input
          onFocus={() => setInpFocused(true)}
          onBlur={() => setInpFocused(false)}
          className={clsx(classes.inp, className)}
          placeholder={placeholder ?? defaultPlaceholder}
          {...rest}
        />
      </div>
    </div>
  );
};

const useStyles = makeStyles(theme => ({
  wrapper: {
    position: 'sticky',
    top: '0',
    zIndex: 100,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '60px',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme.shadows[4] : theme.shadows[1],
    transition: 'box-shadow 0.2s linear'
  },
  inner: {
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  },
  inp: {
    padding: '1rem 2rem 1rem 4rem',
    display: 'block',
    width: '100%',
    border: 'none',
    height: '60px',
    fontSize: '1.2rem',
    fontWeight: 300,
    background: 'none',
    '&:focus': {
      outline: 'none !important'
    }
  },
  icon: {
    position: 'absolute',
    left: '2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.5rem',
    color: theme.palette.grey[500]
  }
}));
