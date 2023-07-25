import React from 'react';
import { useLocation } from 'react-router-dom';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import makeStyles from '@mui/styles/makeStyles';
import { Header, GovBanner } from 'components';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflow: 'auto'
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

interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const classes = useStyles();
  const { pathname } = useLocation();

  return (
    <ScopedCssBaseline classes={{ root: classes.overrides }}>
      <div className={classes.root}>
        <GovBanner />
        <Header />

        {pathname === '/inventory' ? (
          children
        ) : (
          <div className={classes.content}>{children}</div>
        )}
      </div>
    </ScopedCssBaseline>
  );
};
