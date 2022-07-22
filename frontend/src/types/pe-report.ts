import { Organization } from './organization';

export interface PeReport {
  id: string;
  createdAt: string;
  uploadedAt: string;
  organization: Organization;
}
