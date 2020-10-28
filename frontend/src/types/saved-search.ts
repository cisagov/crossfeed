import { User } from './user';

export interface SavedSearch {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  searchTerm: string;
  count: number;
  filters: { field: string; values: any[]; type: string }[];
  createdBy: User;
}
