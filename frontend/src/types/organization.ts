import { Role } from './role';

export interface Organization {
  id: string;
  name: string;
  rootDomains: string[];
  ipBlocks: string[];
  isPassive: boolean;
  userRoles: Role[];
}
