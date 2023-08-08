import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { Header, GovBanner } from 'components';
import { useUserActivityTimeout } from 'hooks/useUserActivityTimeout';
import { useAuthContext } from 'context/AuthContext';
import UserInactiveModal from './UserInactivityModal/UserInactivityModal';

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

export const Layout: React.FC = ({ children }) => {
  const classes = useStyles();
  const { logout, user } = useAuthContext();
  const [loggedIn, setLoggedIn] = useState<boolean>(
    user !== null && user !== undefined ? true : false
  );
  const { isTimedOut, resetTimeout } = useUserActivityTimeout(
    0.1 * 60 * 1000,
    loggedIn
  );

  const handleCountdownEnd = (shouldLogout: boolean) => {
    if (shouldLogout) {
      logout();
    } else {
      resetTimeout();
    }
  };

  const { pathname } = useLocation();

  useEffect(() => {
    // set logged in if use exists then set true, otherwise set false
    if (user) setLoggedIn(user !== null && user !== undefined ? true : false);
    else setLoggedIn(false);
  }, [user]);

  return (
    <ScopedCssBaseline classes={{ root: classes.overrides }}>
      <div className={classes.root}>
        <UserInactiveModal
          isOpen={isTimedOut}
          onCountdownEnd={handleCountdownEnd}
          countdown={3}
        />
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
