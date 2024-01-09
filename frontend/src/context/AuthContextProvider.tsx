import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Auth } from 'aws-amplify';
import { AuthContext, AuthUser } from './AuthContext';
import { User, Organization, OrganizationTag } from 'types';
import { useApi } from 'hooks/useApi';
import { usePersistentState } from 'hooks';
import {
  getExtendedOrg,
  getMaximumRole,
  getTouVersion,
  getUserMustSign
} from './userStateUtils';
import Cookies from 'universal-cookie';
import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';
import { AlertProps } from '@mui/lab';

export const currentTermsVersion = '1';

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({
  children
}) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [token, setToken] = usePersistentState<string | null>('token', null);
  const [org, setOrg] = usePersistentState<
    Organization | OrganizationTag | null
  >('organization', null);
  const [showMap, setShowMap] = usePersistentState<boolean>('showMap', false);
  const [showAllOrganizations, setShowAllOrganizations] =
    usePersistentState<boolean>('showAllOrganizations', false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    message: string;
    type: AlertProps['severity'];
  } | null>(null);
  const cookies = useMemo(() => new Cookies(), []);

  const logout = useCallback(async () => {
    const shouldReload = !!token;

    localStorage.clear();
    await Auth.signOut();
    cookies.remove('crossfeed-token', {
      domain: process.env.REACT_APP_COOKIE_DOMAIN
    });

    if (shouldReload) {
      // Refresh the page only if the token was previously defined
      // (i.e. it is now invalid / has expired now).
      window.location.reload();
    }
  }, [cookies, token]);

  const handleError = useCallback(
    async (e: Error) => {
      if (e.message.includes('401')) {
        // Unauthorized, log out user
        await logout();
      }
    },
    [logout]
  );

  const api = useApi(handleError);
  const { apiGet, apiPost } = api;

  const getProfile = useCallback(async () => {
    const user: User = await apiGet<User>('/users/me');
    setAuthUser({
      ...user,
      isRegistered: user.firstName !== ''
    });
  }, [setAuthUser, apiGet]);

  const setProfile = useCallback(
    async (user: User) => {
      setAuthUser({
        ...user,
        isRegistered: user.firstName !== ''
      });
    },
    [setAuthUser]
  );

  const refreshUser = useCallback(async () => {
    try {
      if (!token && process.env.REACT_APP_USE_COGNITO) {
        const session = await Auth.currentSession();
        const { token } = await apiPost<{ token: string; user: User }>(
          '/auth/callback',
          {
            body: {
              token: session.getIdToken().getJwtToken()
            }
          }
        );
        setToken(token);
      }
    } catch (error) {
      console.log(error);
    }
  }, [apiPost, setToken, token]);

  const extendedOrg = useMemo(() => {
    return getExtendedOrg(org, authUser);
  }, [org, authUser]);

  const maximumRole = useMemo(() => {
    return getMaximumRole(authUser);
  }, [authUser]);

  const touVersion = useMemo(() => {
    return getTouVersion(maximumRole);
  }, [maximumRole]);

  const userMustSign = useMemo(() => {
    return getUserMustSign(authUser, touVersion);
  }, [authUser, touVersion]);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthUser(null);
    } else {
      getProfile();
    }
  }, [token, getProfile]);

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        token,
        setUser: setProfile,
        refreshUser,
        setOrganization: setOrg,
        showMaps: showMap,
        setShowMaps: setShowMap,
        currentOrganization: extendedOrg,
        showAllOrganizations: showAllOrganizations,
        setShowAllOrganizations: setShowAllOrganizations,
        login: setToken,
        logout,
        setLoading: () => {},
        maximumRole,
        touVersion,
        userMustSign,
        setFeedbackMessage,
        userType: '',
        ...api
      }}
    >
      {api.loading && (
        <div className="cisa-crossfeed-loading">
          <div></div>
          <div></div>
        </div>
      )}
      {feedbackMessage && (
        <Snackbar
          open={!!feedbackMessage}
          autoHideDuration={5000}
          onClose={() => setFeedbackMessage(null)}
        >
          <Alert
            onClose={() => setFeedbackMessage(null)}
            severity={feedbackMessage.type}
          >
            {feedbackMessage.message}
          </Alert>
        </Snackbar>
      )}
      {children}
    </AuthContext.Provider>
  );
};
