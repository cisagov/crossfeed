import React from 'react';
import { makeStyles } from '@material-ui/core';

interface Props {
  items: {
    label: string;
    value: string;
  }[];
}

export const DefinitionList: React.FC<Props> = (props) => {
  const { items } = props;
  const classes = useStyles();

  return (
    <dl className={classes.list}>
      {items.map(({ label, value }) => (
        <div className={classes.item} key={value}>
          <dt>{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    margin: '0 0 1.5rem 0'
  },
  list: {
    width: '100%',
    margin: 0
  },
  item: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row wrap',

    '& > dt': {
      color: '#71767A',
      display: 'block',
      margin: 0,
      paddingRight: '0.5rem'
    },
    '& > dd': {
      color: '#3D4551',
      margin: 0
    }
  }
}));
