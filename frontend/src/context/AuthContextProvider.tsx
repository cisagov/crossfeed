import React, { useState, useCallback, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { AuthContext, AuthUser, CurrentOrganization } from './AuthContext';
import { User, Organization } from 'types';
import { useHistory } from 'react-router-dom';
import { useApi } from 'hooks/useApi';

export const AuthContextProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [org, setOrg] = useState<CurrentOrganization | null>(null);
  const history = useHistory();

  const handleError = useCallback(
    async (e: Error) => {
      if (e.message.includes('401')) {
        // Unauthorized, log out user
        await logout();
        history.push('/');
      }
    },
    [history]
  );

  const api = useApi(handleError);
  const { apiGet, apiPost } = api;

  const refreshState = async () => {
    const organization = localStorage.getItem('organization');

    if (organization) {
      setOrganization(JSON.parse(organization));
    } else if (user) {
      if (user.roles.length > 0) {
        setOrganization(user.roles[0].organization);
      }
    }
  };

  const setOrganization = async (organization: Organization) => {
    let extendedOrg: CurrentOrganization = organization;
    extendedOrg.userIsAdmin =
      user?.userType === 'globalAdmin' ||
      user?.roles.find(role => role.organization.id === org?.id)?.role ===
        'admin';
    localStorage.setItem('organization', JSON.stringify(extendedOrg));
    setOrg(extendedOrg);
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    refreshState();
    // eslint-disable-next-line
  }, [user]);

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    await Auth.signOut();
  };

  const login = async (token: string, user: User) => {
    let userCopy: AuthUser = {
      isRegistered: user.firstName !== '',
      ...user
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userCopy));
    setUser(userCopy);
  };

  const refreshUser = async () => {
    if (!localStorage.getItem('token')) {
      if (process.env.REACT_APP_USE_COGNITO) {
        const session = await Auth.currentSession();
        const { token, user } = await apiPost<{ token: string; user: User }>(
          '/auth/callback',
          {
            body: {
              token: session.getIdToken().getJwtToken()
            }
          }
        );
        await login(token, user);
      } else {
        return;
      }
    }
    const user: User = await apiGet('/users/me');
    const userCopy: AuthUser = {
      isRegistered: user.firstName !== '',
      ...user
    };
    localStorage.setItem('user', JSON.stringify(userCopy));
    setUser(userCopy);
  };

  return (
    <AuthContext.Provider
      value={{
        setOrganization,
        refreshUser,
        user,
        currentOrganization: org,
        login,
        logout,
        setLoading: () => {},
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
