import React from 'react';
import { useLocation } from 'react-router-dom';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { Header, GovBanner } from 'components';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflow: 'hidden'
  },
  overrides: {
    WebkitFontSmoothing: 'unset',
    MozOsxFontSmoothing: 'unset'
  },
  content: {
    flex: '1',
    display: 'block',
    position: 'relative'
  }
}));

export const Layout: React.FC = ({ children }) => {
  const classes = useStyles();
  const { pathname } = useLocation();

  return (
    <ScopedCssBaseline classes={{ root: classes.overrides }}>
      <div className={classes.root}>
        <GovBanner />
        <Header />

        {pathname === '/' ? (
          children
        ) : (
          <div className={classes.content}>{children}</div>
        )}
      </div>
    </ScopedCssBaseline>
  );
};
