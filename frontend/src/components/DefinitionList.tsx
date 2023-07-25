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
      {items.map(({ label, value }) => (
        <div className={classes.root} key={value}>
          <dt>{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </Root>
  );
};

const PREFIX = 'DefinitionList'
const classes = {
  root: `${PREFIX}-root`,
  content: `${PREFIX}-content`,
}

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    margin: '0 0 1.5rem 0'
  },
  [`&. ${classes.content}`]: {
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
  }
}));
