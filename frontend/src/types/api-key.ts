import { User } from './user';

export interface ApiKey {
  id: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  hashedKey: string;
  lastFour: string;
  lastUsed: string;
}
