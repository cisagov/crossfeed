import { Cve } from './cve';
export interface ProductInfo {
  id: string;
  cpe_product_name: string;
  last_seen: Date;
  vender?: string | any;
  version_number: string;
  cve: Cve[];
}
