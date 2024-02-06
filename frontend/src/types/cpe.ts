import { Cve } from './cve';
export interface Cpe {
  id: string;
  cpe_product_name: string;
  version_number: string;
  vender: string;
  last_seen: Date;
  cve: Cve[];
}
