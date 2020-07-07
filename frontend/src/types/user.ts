import { Role } from './role';

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  roles: Role[];
}
