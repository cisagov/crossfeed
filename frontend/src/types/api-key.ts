import { User } from './user';

export interface ApiKey {
  id: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  key: string;
  lastUsed: string;
}
