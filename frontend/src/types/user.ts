import { Role } from './role';
import { ApiKey } from './api-key';

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  fullName: string;
  invitePending: boolean;
  userType: 'standard' | 'globalView' | 'globalAdmin'| 'regionalAdmin';
  email: string;
  roles: Role[];
  dateAcceptedTerms: string | null;
  acceptedTermsVersion: string | null;
  lastLoggedIn: string | null;
  apiKeys: ApiKey[];
  regionId: string | null;
  state: string | null;
}
