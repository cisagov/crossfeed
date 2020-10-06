import { Scan } from './scan';
import { Domain } from './domain';

export interface Webpage {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
  domain: Domain;
  discoveredBy: Scan;
  lastSeen: Date | null;
  s3Key: string | null;
  url: string;
  status: number;
  responseSize: number | null;
}
