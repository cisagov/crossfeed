import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Header, Footer, GovBanner } from 'components';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexFlow: 'column nowrap'
  },
  content: {
    flex: 1
  }
}));

export const Layout: React.FC = ({ children }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className="usa-overlay " />
      <GovBanner />
      <Header />

      <div className={classes.content}>{children}</div>

      <Footer />
    </div>
  );
};
