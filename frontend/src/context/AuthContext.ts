import React, { useContext } from 'react';
import { useApi } from 'hooks';
import { User, Organization } from 'types';

export interface AuthUser extends User {
  isRegistered: boolean;
}

export interface CurrentOrganization extends Organization {
  userIsAdmin?: boolean | null;
}

export interface AuthContextType extends ReturnType<typeof useApi> {
  login(token: string, user: User): Promise<any>;
  logout(): Promise<void>;
  user?: AuthUser | null;
  currentOrganization?: CurrentOrganization | null;
  setOrganization: (organization: CurrentOrganization) => Promise<void>;
  refreshUser: () => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
}

/* istanbul ignore next */
export const defaultAuthContext = ({
  login: async () => {},
  logout: async () => {},
  apiGet: async () => {},
  apiPost: async () => {},
  apiPut: async () => {},
  apiDel: async () => {},
  apiPatch: async () => {},
  setOrganization: <T>(organization: CurrentOrganization) => ({} as T),
  refreshUser: async <T>() => ({} as T),
  setLoading: () => null
} as unknown) as AuthContextType;

export const AuthContext = React.createContext<AuthContextType>(
  defaultAuthContext
);

export const useAuthContext = (): AuthContextType => {
  return useContext(AuthContext);
};
