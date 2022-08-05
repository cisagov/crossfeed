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
  granularScans: Scan[];
  tags: OrganizationTag[];
  parent: Organization | null;
  children: Organization[];
}

export interface OrganizationTag {
  id: string;
  name: string;
  tags: OrganizationTag[];
  organizations: Organization[];
  scans: Scan[];
}
