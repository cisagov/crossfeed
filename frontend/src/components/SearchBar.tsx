import React, { useState } from 'react';
import clsx from 'classnames';
import { List, ListItem, makeStyles, Paper } from '@material-ui/core';
import { SearchOutlined } from '@material-ui/icons';

interface Props
  extends Partial<Omit<JSX.IntrinsicElements['input'], 'onChange'>> {
  autocompletedResults: {
    id: { raw: string };
    text: { raw: string };
  }[];
  onSelectResult(id: string): void;
  onChange(value: string): void;
}

const defaultPlaceholder = 'Search for a domain, vuln type, port, service, IP';

type Timer = ReturnType<typeof setTimeout>;

export const SearchBar = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const {
      className,
      placeholder,
      autocompletedResults,
      onSelectResult,
      onChange,
      ...rest
    } = props;
    const [hasFocus, setHasFocus] = useState(false);
    const [focusTimer, setFocusTimer] = useState<Timer>();
    const classes = useStyles({ inpFocused: hasFocus });

    const handleFocus = () => {
      clearTimeout(focusTimer as Timer);
      setHasFocus(true);
    };

    const handleBlur = () => {
      setFocusTimer(setTimeout(() => setHasFocus(false), 100));
    };

    return (
      <div className={classes.wrapper}>
        <div className={classes.inner}>
          <SearchOutlined className={classes.icon} />
          <input
            {...rest}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={clsx(classes.inp, className)}
            placeholder={placeholder ?? defaultPlaceholder}
            onChange={(e) => onChange(e.target.value)}
            ref={ref}
          />
          {autocompletedResults.length > 0 && hasFocus && (
            <Paper classes={{ root: classes.autocompleteRoot }}>
              <List>
                {autocompletedResults.map((result) => (
                  <ListItem
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    button
                    key={result.id.raw}
                    onClick={() => {
                      onSelectResult(result.id.raw);
                      onChange(result.text.raw);
                    }}
                  >
                    {result.text.raw}
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </div>
      </div>
    );
  }
);

const useStyles = makeStyles((theme) => ({
  wrapper: {
    zIndex: 101,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '60px',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme.shadows[4] : theme.shadows[1],
    transition: 'box-shadow 0.3s linear'
  },
  inner: {
    flex: '1',
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
  },
  autocompleteRoot: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: '1rem',
    minWidth: 600
  },
  actionBtn: {
    borderColor: '#28A0CB',
    color: '#28A0CB'
  }
}));
