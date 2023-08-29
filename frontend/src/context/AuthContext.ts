import React, { useContext } from 'react';
import { useApi } from 'hooks';
import { User, Organization, OrganizationTag } from 'types';
import { AlertProps } from '@mui/lab';

export interface AuthUser extends User {
  isRegistered: boolean;
}

export type CurrentOrganization = Organization | OrganizationTag;

export interface AuthContextType extends ReturnType<typeof useApi> {
  userType: string;
  login(token: string): void;
  logout(): Promise<void>;
  user?: AuthUser | null;
  setUser(user: User): void;
  token: string | null;
  currentOrganization?: CurrentOrganization | null;
  setOrganization: (organization: CurrentOrganization) => void;
  showMaps: boolean;
  setShowMaps: (showMap: boolean) => void;
  showAllOrganizations: boolean;
  setShowAllOrganizations: (showAllOrganizations: boolean) => void;
  refreshUser: () => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
  setFeedbackMessage: (message: {
    message: string;
    type: AlertProps['severity'];
  }) => void;
  maximumRole: 'user' | 'admin';
  touVersion: string;
  userMustSign: boolean;
}

export const AuthContext = React.createContext<AuthContextType>(undefined!);

export const useAuthContext = (): AuthContextType => {
  return useContext(AuthContext);
};
