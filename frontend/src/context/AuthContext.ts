import React, { useContext } from 'react';
import { User } from 'types';

export interface AuthUser extends User {
  isRegistered: boolean;
}

export interface AuthContextType {
  login(token: string, user: User): Promise<any>;
  logout(): Promise<void>;
  apiGet<T extends object = any>(path: string, init?: any): Promise<T>;
  apiPost<T extends object = any>(path: string, init: any): Promise<T>;
  apiPut<T extends object = any>(path: string, init: any): Promise<T>;
  apiDelete<T extends object = any>(path: string, init?: any): Promise<T>;
  user?: AuthUser | null;
}

/* istanbul ignore next */
export const defaultAuthContext: AuthContextType = {
  login: async () => {},
  logout: async () => {},
  apiGet: async <T>() => ({} as T),
  apiPost: async <T>() => ({} as T),
  apiPut: async <T>() => ({} as T),
  apiDelete: async <T>() => ({} as T)
};

export const AuthContext = React.createContext<AuthContextType>(
  defaultAuthContext
);

export const useAuthContext = (): AuthContextType => {
  return useContext(AuthContext);
};
