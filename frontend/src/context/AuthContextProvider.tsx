import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Auth } from 'aws-amplify';
import { AuthContext, AuthUser } from './AuthContext';
import { User, Organization } from 'types';
import { useHistory } from 'react-router-dom';
import { useApi } from 'hooks/useApi';
import { usePersistentState } from 'hooks';
import {
  getExtendedOrg,
  getMaximumRole,
  getTouVersion,
  getUserMustSign
} from './userStateUtils';

export const currentTermsVersion = '1';

export const AuthContextProvider: React.FC = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [token, setToken] = usePersistentState<string | null>('token', null);
  const [org, setOrg] = usePersistentState<Organization | null>(
    'organization',
    null
  );
  const history = useHistory();

  const logout = useCallback(async () => {
    localStorage.clear();
    await Auth.signOut();
  }, []);

  const handleError = useCallback(
    async (e: Error) => {
      if (e.message.includes('401')) {
        // Unauthorized, log out user
        await logout();
        history.push('/');
      }
    },
    [history, logout]
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
        currentOrganization: extendedOrg,
        login: setToken,
        logout,
        setLoading: () => {},
        maximumRole,
        touVersion,
        userMustSign,
        ...api
      }}
    >
      {api.loading && (
        <div className="cisa-crossfeed-loading">
          <div></div>
          <div></div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};
