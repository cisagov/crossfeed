import React, { useState, useCallback, useEffect } from 'react';
import { Auth, API } from 'aws-amplify';
import { AuthContext, User } from './AuthContext';
import { useHistory } from 'react-router-dom';

// to be added to every request
const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

export const AuthContextProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>();

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
  };

  const login = async (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
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
