import { User } from './user';
import { Organization } from './organization';

export interface Role {
  id: string;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'admin';
  user: User;
  organization: Organization;
  approved: boolean;
}
