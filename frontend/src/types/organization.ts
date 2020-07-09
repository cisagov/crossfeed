import { Role } from './role';

export interface Organization {
  id: string;
  name: string;
  rootDomains: string[];
  ipBlocks: string[];
  userRoles: Role[];
  isPassive: boolean;
  inviteOnly: boolean;
}
