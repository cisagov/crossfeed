import { Role } from './role';
import { ScanTask } from './scan-task';

export interface Organization {
  id: string;
  name: string;
  rootDomains: string[];
  ipBlocks: string[];
  userRoles: Role[];
  scanTasks: ScanTask[];
  isPassive: boolean;
  inviteOnly: boolean;
}
