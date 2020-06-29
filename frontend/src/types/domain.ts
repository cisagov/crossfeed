import { SortingRule, Filters } from 'react-table';

export interface Query<T extends object> {
  sort: SortingRule<T>[];
  page: number;
  filters: Filters<T>;
}

export interface Service {
  port: string;
  service: string;
  id: number;
  lastSeen: string | null;
  banner: string | null;
}

export interface Domain {
  id: number;
  name: string;
  reverseName: string;
  ip: string;
  updatedAt: string;
  services: string;
  ports: string;
  technologies: Technology[] | null;
  web: WebInfo | null;
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

export interface WebInfo {
  id: string;
  technologies: Technology[];
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

export interface FullDomain {
  id: string;
  name: string;
  ip: string;
  updatedAt: string;
  ssl: SSLInfo | null;
  web: WebInfo | null;
  screenshot: string | null;
  country: string | null;
  asn: string | null;
  cloudHosted: boolean;
  services: Service[];
}
