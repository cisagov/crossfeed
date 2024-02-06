import { Cve } from './cve';
export interface ProductInfo {
  id: string;
  cpe_product_name: string;
  version_number: string;
  vender: string;
  last_seen: Date;
  cve: Cve[];
}
