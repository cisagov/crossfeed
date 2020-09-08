import { SortingRule, Filters } from 'react-table';
import { Organization } from './organization';
import { Vulnerability } from './vulnerability';

export interface Query<T extends object> {
  sort: SortingRule<T>[];
  page: number;
  filters: Filters<T>;
}

export interface Product {
  // Common name
  name: string;
  // Product name
  product?: string;
  // Product vendor
  vendor?: string;
  // Product version
  version: string;
  // Product version revision
  revision?: string;
  // CPE without version (unique identifier)
  cpe?: string;
  // Optional icon
  icon?: string;
  // Optional description
  description?: string;
  // Tags
  tags: string[];
}

export interface Service {
  port: string;
  service: string;
  id: number;
  lastSeen: string | null;
  banner: string | null;
  censysMetadata: {
    product: string;
    revision: string;
    description: string;
    version: string;
    manufacturer: string;
  } | null;
  censysIpv4Results: any;
  wappalyzerResults: Technology[];
  products: Product[];
}

export interface Domain {
  id: string;
  name: string;
  ip: string;
  updatedAt: string;
  screenshot: string | null;
  country: string | null;
  asn: string | null;
  cloudHosted: boolean;
  services: Service[];
  vulnerabilities: Vulnerability[];
  organization: Organization;
  ssl: SSLInfo | null;
}

export interface SSLInfo {
  issuerOrg: string | null;
  issuerCN: string | null;
  validTo: string | null;
  validFrom: string | null;
  altNames: string | null;
  protocol: string | null;
  fingerprint: string | null;
  bits: string | null;
}

export interface Technology {
  name: string;
  slug: string;
  version: string;
  icon: string;
  website: string;
  confidence: number;
  categories: {
    name: string;
    slug: string;
    id: number;
  }[];
}
