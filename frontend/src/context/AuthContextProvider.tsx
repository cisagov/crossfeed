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
  const [unverifiedUser, setUnverifiedUser] = useState<any>();
  const history = useHistory();

  const refreshUser = async () => {
    try {
      const existing = await Auth.currentAuthenticatedUser();
      setUser(existing);
    } catch (e) {
      // if (process.env.NODE_ENV === 'development')
      //   setUser({
      //     email: '',
      //     email_verified: true,
      //     phone_number: '',
      //     phone_number_verified: true
      //   });
      // else setUser(null);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const user = await Auth.signIn(username, password);
    if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
      setUnverifiedUser(user);
      history.push('/create-password');
    } else {
      setUser(user);
    }
    return user;
  };

  const logout = async () => {
    await Auth.signOut();
    setUser(null);
  };

  const resetPassword = async (
    currentpassword: string,
    newpassword: string
  ) => {
    const user = await Auth.currentAuthenticatedUser();
    await Auth.changePassword(user, currentpassword, newpassword);
  };

  const completePassword = async (password: string) => {
    const result = await Auth.completeNewPassword(unverifiedUser, password, {});
    setUnverifiedUser(undefined);
    setUser(result);
  };

  const prepareInit = useCallback(async (init: any) => {
    const { headers, ...rest } = init;
    let token;
    if (process.env.NODE_ENV === 'development') {
      token = '';
    } else {
      const session = await Auth.currentSession();
      token = await session.getIdToken().getJwtToken();
    }
    return {
      ...rest,
      headers: {
        ...headers,
        ...baseHeaders,
        Authorization: token
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
        resetPassword,
        completePassword: unverifiedUser ? completePassword : undefined,
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
