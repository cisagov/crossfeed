import React from 'react';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { Header, GovBanner } from 'components';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexFlow: 'column nowrap'
  },
  content: {
    flex: 1
  },
  overrides: {
    WebkitFontSmoothing: 'unset',
    MozOsxFontSmoothing: 'unset'
  }
}));

export const Layout: React.FC = ({ children }) => {
  const classes = useStyles();

  return (
    <ScopedCssBaseline classes={{ root: classes.overrides }}>
      <div className={classes.root}>
        <GovBanner />
        <Header />

        <div className={classes.content}>{children}</div>
      </div>
    </ScopedCssBaseline>
  );
};
