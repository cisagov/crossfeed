import { Role } from './role';
import { ScanTask } from './scan-task';
import { Scan } from './scan';

export interface Organization {
  id: string;
  name: string;
  rootDomains: string[];
  ipBlocks: string[];
  userRoles: Role[];
  scanTasks: ScanTask[];
  isPassive: boolean;
  inviteOnly: boolean;
  granularScans: Scan[];
  tags: OrganizationTag[];
}

export interface OrganizationTag {
  id: string;
  name: string;
  organizations: Organization[];
}
