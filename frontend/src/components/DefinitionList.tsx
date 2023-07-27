import React from 'react';
import { styled } from '@mui/material/styles';

interface Props {
  items: {
    label: string;
    value: string;
  }[];
}

export const DefinitionList: React.FC<Props> = (props) => {
  const { items } = props;
  return (
    <Root className={classes.root}>
      <dl className={classes.list}>
        {items.map(({ label, value }) => (
          <div className={classes.root} key={value}>
            <dt>{label}:</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Root>
  );
};

//Styling
const PREFIX = 'DefinitionList';
const classes = {
  root: `${PREFIX}-root`,
  content: `${PREFIX}-content`,
  list: `${PREFIX}-list`,
  item: `${PREFIX}-item`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    margin: '0 0 1.5rem 0'
  },

  [`&. ${classes.list}`]: {
    width: '100%',
    margin: 0
  },

  [`& .${classes.item}`]: {
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
