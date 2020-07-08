import React, { useContext } from 'react';

export interface User {
  email: string;
  email_verified: boolean;
  phone_number: string;
  phone_number_verified: boolean;
}

export interface AuthContextType {
  login(username: string, password: string): Promise<any>;
  logout(): Promise<void>;
  apiGet<T extends object = any>(path: string, init?: any): Promise<T>;
  apiPost<T extends object = any>(path: string, init: any): Promise<T>;
  apiPut<T extends object = any>(path: string, init: any): Promise<T>;
  apiDelete<T extends object = any>(path: string, init?: any): Promise<T>;
  user?: User | null;
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
