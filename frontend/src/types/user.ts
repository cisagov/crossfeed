import { Role } from './role';

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  fullName: string;
  invitePending: boolean;
  userType: 'standard' | 'globalView' | 'globalAdmin';
  email: string;
  roles: Role[];
  dateAcceptedTerms: Date | null;
  acceptedTermsVersion: string | null;
}
