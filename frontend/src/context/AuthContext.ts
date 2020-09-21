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
  login(token: string): void;
  logout(): Promise<void>;
  user?: AuthUser | null;
  setUser(user: User): void;
  token: string | null;
  currentOrganization?: CurrentOrganization | null;
  setOrganization: (organization: CurrentOrganization) => void;
  refreshUser: () => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
  maximumRole: 'user' | 'admin';
  touVersion: string;
  userMustSign: boolean;
}

export const AuthContext = React.createContext<AuthContextType>(undefined!);

export const useAuthContext = (): AuthContextType => {
  return useContext(AuthContext);
};
