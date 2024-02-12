import { Cve } from './cve';
export interface Cpe {
  id: string;
  name: string;
  lastSeenAt: Date;
  vendor?: string | any;
  version: string;
  cves: Cve[];
}
