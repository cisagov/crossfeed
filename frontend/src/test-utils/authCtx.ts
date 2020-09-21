import { AuthContextType } from 'context';
import { testUser } from './user';

export const authCtx: AuthContextType = {
  user: testUser,
  token: 'some-test-token-never-verified',
  currentOrganization: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  setUser: jest.fn(),
  setOrganization: jest.fn(),
  refreshUser: jest.fn(),
  setLoading: jest.fn(),
  apiGet: jest.fn(),
  apiDelete: jest.fn(),
  apiPatch: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  maximumRole: 'user',
  touVersion: 'v1-user',
  userMustSign: false
};
