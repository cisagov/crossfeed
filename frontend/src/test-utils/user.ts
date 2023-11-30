import { AuthUser } from 'context';

export const testUser: AuthUser = {
  id: 'd7d6e913-0370-4f43-aebc-6bd727adc70e',
  createdAt: '2020-08-23T03:36:57.231Z',
  updatedAt: '2020-08-23T03:36:57.231Z',
  lastLoggedIn: new Date().toISOString(),
  firstName: 'John',
  lastName: 'Smith',
  fullName: 'John Smith',
  invitePending: false,
  userType: 'standard',
  email: 'test@crossfeed.gov',
  roles: [],
  dateAcceptedTerms: new Date().toISOString(),
  acceptedTermsVersion: 'v1-user',
  isRegistered: true,
  apiKeys: [],
  regionId: '1234',
  state: 'LA'
};
