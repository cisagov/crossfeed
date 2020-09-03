import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4),
    width: '100%',
    color: 'white',
    textAlign: 'center',
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main
  }
}));

export const Footer: React.FC = () => {
  const classes = useStyles();

  return (
    <footer className={classes.root}>
      Cybersecurity and Infrastructure Security Agency
    </footer>
  );
};
