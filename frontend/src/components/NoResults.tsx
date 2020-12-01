import React from 'react';
import { makeStyles, Paper } from '@material-ui/core';

interface Props {
  message: string;
}

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: '10px',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '1px solid #DCDEE0',
    height: '450px',
    width: '550px',
    display: 'flex',
    borderRadius: '5px',
    margin: '0 auto',
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'column',
    '& p': {
      textAlign: 'center',
      lineHeight: 1.5,
      color: theme.palette.primary.main,
      fontSize: '1rem'
    },
    padding: '1rem'
  }
}));

export const NoResults: React.FC<Props> = (props) => {
  const classes = useStyles();
  return (
    <Paper className={classes.card}>
      <p>{props.message}</p>
    </Paper>
  );
};
