import React, { useState, useCallback, useEffect } from 'react';
import { API } from 'aws-amplify';
import { AuthContext, AuthUser } from './AuthContext';
import { User } from 'types';

// to be added to every request
const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

export const AuthContextProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>();

  const refreshUser = async () => {
    const user = localStorage.getItem('user');
    if (user) {
      setUser(JSON.parse(user));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
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
      const options = await prepareInit(init);
      const result = await API.get('crossfeed', path, options);
      return result as T;
    },
    [prepareInit]
  );

  const apiPost = useCallback(
    async <T extends object = {}>(path: string, init: any) => {
      const options = await prepareInit(init);
      const result = await API.post('crossfeed', path, options);
      return result as T;
    },
    [prepareInit]
  );

  const apiDelete = useCallback(
    async <T extends object = {}>(path: string, init: any = {}) => {
      const options = await prepareInit(init);
      const result = await API.del('crossfeed', path, options);
      return result as T;
    },
    [prepareInit]
  );

  const apiPut = useCallback(
    async <T extends object = {}>(path: string, init: any) => {
      const options = await prepareInit(init);
      const result = await API.put('crossfeed', path, options);
      return result as T;
    },
    [prepareInit]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        apiGet,
        apiPost,
        apiPut,
        apiDelete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
