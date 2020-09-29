import React from 'react';
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  makeStyles
} from '@material-ui/core';

interface Props {
  options: { value: string; count: number }[];
  selected: string[];
  onSelect(value: string): void;
  onDeselect(value: string): void;
}

export const FacetFilter: React.FC<Props> = props => {
  const classes = useStyles();
  const { options, selected, onSelect, onDeselect } = props;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    e.persist();
    if (e.target.checked) {
      onSelect(value);
    } else {
      onDeselect(value);
    }
  };

  return (
    <>
      <FormGroup classes={{ root: classes.root }}>
        {/* <input className={classes.inp} placeholder="Filter" /> */}
        {options.map(opt => (
          <FormControlLabel
            classes={{ label: classes.label, root: classes.formControl }}
            key={opt.value}
            control={
              <Checkbox
                checked={selected.includes(opt.value)}
                onChange={e => handleChange(e, opt.value)}
              />
            }
            label={
              <>
                <span>{opt.value}</span>
                <span className={classes.count}>{opt.count}</span>
              </>
            }
          />
        ))}
      </FormGroup>
    </>
  );
};

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    paddingTop: 0,
    flexWrap: 'nowrap'
  },
  inp: {
    border: 'none',
    backgroundColor: '#fff',
    width: '100%',
    padding: '1rem',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px #FFF, 0 1px 0 #FFF'
  },
  label: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    marginRight: 0,
    '& span': {
      display: 'inline-block'
    },
    '& $count': {
      fontSize: '0.7rem',
      color: theme.palette.grey[700]
    }
  },
  formControl: {
    width: 'calc(100% + 8px)'
  },
  count: {}
}));
