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
  pendingDomains: PendingDomain[];
  country?: string;
  regionId?: string;
  state?: string;
  stateFips?: number;
  stateName?: string;
  county?: string;
  countyFips?: number;
  acronym: string;
  type: string;
  userCount?: number;
  tagNames?: string[];
}

export interface PendingDomain {
  name: string;
  token: string;
}

export interface OrganizationTag {
  id: string;
  name: string;
  tags: OrganizationTag[];
  organizations: Organization[];
  scans: Scan[];
}
