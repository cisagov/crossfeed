import { User } from './user';
import { Vulnerability } from './vulnerability';

export interface SavedSearch {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  searchTerm: string;
  count: number;
  filters: { field: string; values: any[]; type: string }[];
  createdBy: User;
  searchPath: string;
  sortField: string;
  sortDirection: string;
  createVulnerabilities: boolean;
  vulnerabilityTemplate: Partial<Vulnerability>;
}
