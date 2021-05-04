import React, { useState, useEffect } from 'react';
import clsx from 'classnames';
import { List, ListItem, makeStyles, Paper } from '@material-ui/core';
import { SearchOutlined } from '@material-ui/icons';

interface Props
  extends Partial<Omit<JSX.IntrinsicElements['input'], 'onChange'>> {
  autocompletedResults?: {
    id: { raw: string };
    text: { raw: string };
  }[];
  onSelectResult?(id: string): void;
  onChange(value: string): void;
  initialValue: string;
}

const defaultPlaceholder = 'Search for a domain, vuln type, port, service, IP';

type Timer = ReturnType<typeof setTimeout>;

export const SearchBar = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const {
      initialValue,
      className,
      placeholder,
      autocompletedResults,
      onSelectResult,
      onChange,
      ...rest
    } = props;
    const [hasFocus, setHasFocus] = useState(false);
    const [focusTimer, setFocusTimer] = useState<Timer>();
    const [query, setQuery] = useState<string>(initialValue);
    const classes = useStyles({ inpFocused: hasFocus });

    const { value } = props;
    useEffect(() => {
      setQuery(value?.toString() ?? '');
    }, [value]);

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onChange(query);
            }}
          >
            <input
              {...rest}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={clsx(classes.inp, className)}
              placeholder={placeholder ?? defaultPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              ref={ref}
            />
          </form>
          {autocompletedResults &&
            onSelectResult &&
            autocompletedResults.length > 0 &&
            hasFocus && (
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
    maxWidth: 400,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    transition: 'box-shadow 0.3s linear',
    borderRadius: '5px'
  },
  inner: {
    flex: '1',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  },
  inp: {
    padding: '0.5rem 0.5rem 0.5rem 2rem',
    display: 'block',
    width: '100%',
    border: 'none',
    height: '45px',
    fontSize: '1rem',
    fontWeight: 300,
    background: 'none',
    "&::placeholder": {
      color: '#71767A'
    },
    '&:focus': {
      outline: 'none !important'
    }
  },
  icon: {
    position: 'absolute',
    left: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.5rem',
    color: '#71767A'
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
