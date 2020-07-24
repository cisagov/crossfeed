import React, { useState, useCallback, useEffect } from 'react';
import { API } from 'aws-amplify';
import { AuthContext, AuthUser, CurrentOrganization } from './AuthContext';
import { User, Organization } from 'types';

// to be added to every request
const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

export const AuthContextProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>();
  const [currentOrganization, setCurrentOrganization] = useState<
    CurrentOrganization
  >();
  const [loading, setLoading] = useState(0);

  const refreshState = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }

    const organization = localStorage.getItem('organization');
    if (organization) {
      setCurrentOrganization(JSON.parse(organization));
    } else if (user && user.roles.length > 0) {
      setOrganization(user.roles[0].organization);
    }
  };

  const setOrganization = async (organization: Organization) => {
    let extendedOrg: CurrentOrganization = organization;
    extendedOrg.userIsAdmin =
      user?.userType == 'globalAdmin' ||
      user?.roles.find(role => role.organization.id === currentOrganization?.id)
        ?.role === 'admin';
    localStorage.setItem('organization', JSON.stringify(extendedOrg));
    setCurrentOrganization(extendedOrg);
  };

  useEffect(() => {
    refreshState();
    // eslint-disable-next-line
  }, []);

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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

  const prepareInit = useCallback(async (init: any) => {
    const { headers, ...rest } = init;
    return {
      ...rest,
      headers: {
        ...headers,
        ...baseHeaders,
        Authorization: localStorage.getItem('token')
      }
    };
  }, []);

  const apiGet = useCallback(
    async <T extends object = {}>(path: string, init: any = {}) => {
      try {
        setLoading(l => l + 1);
        const options = await prepareInit(init);
        const result = await API.get('crossfeed', path, options);
        setLoading(l => l - 1);
        return result as T;
      } catch (e) {
        setLoading(l => l - 1);
        throw e;
      }
    },
    [prepareInit]
  );

  const apiPost = useCallback(
    async <T extends object = {}>(path: string, init: any) => {
      try {
        setLoading(l => l + 1);
        const options = await prepareInit(init);
        const result = await API.post('crossfeed', path, options);
        setLoading(l => l - 1);
        return result as T;
      } catch (e) {
        setLoading(l => l - 1);
        throw e;
      }
    },
    [prepareInit]
  );

  const apiDelete = useCallback(
    async <T extends object = {}>(path: string, init: any = {}) => {
      try {
        setLoading(l => l + 1);
        const options = await prepareInit(init);
        const result = await API.del('crossfeed', path, options);
        setLoading(l => l - 1);
        return result as T;
      } catch (e) {
        setLoading(l => l - 1);
        throw e;
      }
    },
    [prepareInit]
  );

  const apiPut = useCallback(
    async <T extends object = {}>(path: string, init: any) => {
      try {
        setLoading(l => l + 1);
        const options = await prepareInit(init);
        const result = await API.put('crossfeed', path, options);
        setLoading(l => l - 1);
        return result as T;
      } catch (e) {
        setLoading(l => l - 1);
        throw e;
      }
    },
    [prepareInit]
  );

  return (
    <AuthContext.Provider
      value={{
        setOrganization,
        user,
        currentOrganization,
        login,
        logout,
        apiGet,
        apiPost,
        apiPut,
        apiDelete
      }}
    >
      {loading > 0 && (
        <div className="cisa-crossfeed-loading">
          <div></div>
          <div></div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};
