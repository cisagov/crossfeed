import { Organization } from './organization';
import { Vulnerability } from './vulnerability';

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
  intrigueIdentResults: {
    fingerprint: {
      type: string;
      vendor: string;
      product: string;
      version: string;
      update: string;
      tags: string[];
      match_type: string;
      match_details: string;
      hide: boolean;
      cpe: string;
      issue?: string;
      task?: string;
      inference: boolean;
    }[];
    content: {
      type: string;
      name: string;
      hide?: boolean;
      issue?: boolean;
      task?: boolean;
      result?: boolean;
    }[];
  };
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
  cpe?: string;
  categories: {
    name: string;
    slug: string;
    id: number;
  }[];
};
