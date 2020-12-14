import React from 'react';
import { makeStyles, Paper } from '@material-ui/core';
import logo from '../assets/crossfeed_blue.svg';

interface Props {
  message: string;
}

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: '10px',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '1px solid #DCDEE0',
    height: '400px',
    width: '500px',
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
      fontSize: '18px',
      width: '70%',
      margin: '0 auto'
    },
    padding: '1rem'
  },
  logo: {
    width: '100px',
    marginBottom: 25,
    margin: '0 auto'
  }
}));

export const NoResults: React.FC<Props> = (props) => {
  const classes = useStyles();
  return (
    <Paper className={classes.card}>
      <img src={logo} className={classes.logo} alt="Crossfeed Icon" />
      <p>{props.message}</p>
    </Paper>
  );
};
