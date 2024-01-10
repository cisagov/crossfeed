import { User } from 'types';

export const testUsers: User[] = [
  {
    id: 'abc-123',
    createdAt: '2023-10-18T16:51:30.906Z',
    lastLoggedIn: '2023-11-03T21:17:11.774Z',
    updatedAt: '2023-11-03T21:17:11.774Z',
    dateAcceptedTerms: '2023-11-03T21:17:11.774Z',
    fullName: 'Joe Johnson',
    firstName: 'Joe',
    lastName: 'Johnson',
    email: 'joe.johnson@test.gov',
    invitePending: false,
    userType: 'globalAdmin',
    roles: [],
    acceptedTermsVersion: null,
    apiKeys: [],
    state: 'Virginia',
    regionId: '1',
    organizations: [
      'Organization 1',
      'Organization 2',
      'Organization 3',
      'Organization 4',
      'Organization 5'
    ]
  },
  {
    id: 'def-456',
    createdAt: '2023-10-18T16:51:30.906Z',
    lastLoggedIn: '2023-11-03T21:17:11.774Z',
    updatedAt: '2023-11-03T21:17:11.774Z',
    dateAcceptedTerms: '2023-11-03T21:17:11.774Z',
    fullName: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@test.gov',
    invitePending: true,
    userType: 'globalAdmin',
    roles: [],
    acceptedTermsVersion: null,
    apiKeys: [],
    regionId: '1',
    state: 'New Jersey',
    organizations: []
  },
  {
    id: 'ghi-789',
    createdAt: '2023-10-18T16:51:30.906Z',
    lastLoggedIn: '2023-11-03T21:17:11.774Z',
    updatedAt: '2023-11-03T21:17:11.774Z',
    dateAcceptedTerms: '2023-11-03T21:17:11.774Z',
    fullName: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.gov',
    invitePending: true,
    userType: 'globalAdmin',
    roles: [],
    acceptedTermsVersion: null,
    apiKeys: [],
    regionId: '1',
    state: 'Virginia',
    organizations: []
  },
  {
    id: 'jkl-123',
    createdAt: '2023-10-18T16:51:30.906Z',
    lastLoggedIn: '2023-11-03T21:17:11.774Z',
    updatedAt: '2023-11-03T21:17:11.774Z',
    dateAcceptedTerms: '2023-11-03T21:17:11.774Z',
    fullName: 'Harry Jones',
    firstName: 'Harry',
    lastName: 'Jones',
    email: 'harry.jones@test.gov',
    invitePending: false,
    userType: 'globalAdmin',
    roles: [],
    acceptedTermsVersion: null,
    apiKeys: [],
    regionId: '1',
    state: 'Virginia',
    organizations: []
  },
  {
    id: 'mno-456',
    createdAt: '2023-10-18T16:51:30.906Z',
    lastLoggedIn: '2023-11-03T21:17:11.774Z',
    updatedAt: '2023-11-03T21:17:11.774Z',
    dateAcceptedTerms: '2023-11-03T21:17:11.774Z',
    fullName: 'Ronald Potter',
    firstName: 'Ronald',
    lastName: 'Potter',
    email: 'ronald.potter@test.gov',
    invitePending: false,
    userType: 'globalAdmin',
    roles: [],
    acceptedTermsVersion: null,
    apiKeys: [],
    regionId: '2',
    state: 'California',
    organizations: []
  }
];
type organizations = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  userType?: string;
  rootDomains: Array<String>;
  ipBlocks: Array<String>;
  isPassive: boolean;
  pendingDomains: Array<String>;
  userRoles: Array<String>;
  members?: number;
  tags: Array<Object>;
};
export const testOrganizations: organizations[] = [
  {
    id: 'xyz-123',
    createdAt: '2023-11-03T20:19:08.411Z',
    updatedAt: '2023-11-03T20:19:08.411Z',
    name: 'Affectionate Agency',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 5,
    tags: [
      {
        id: 'abc-789',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'qrs-123',
    createdAt: '2023-11-03T20:19:09.899Z',
    updatedAt: '2023-11-03T20:19:09.899Z',
    name: 'Boring City',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 30,
    tags: [
      {
        id: 'lmn-123',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'efg-456',
    createdAt: '2023-11-03T20:19:10.872Z',
    updatedAt: '2023-11-03T20:19:10.872Z',
    name: 'Brave Agency',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 6,
    tags: [
      {
        id: 'hij-789',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'bcd-234',
    createdAt: '2023-11-03T20:19:07.327Z',
    updatedAt: '2023-11-03T20:19:07.327Z',
    name: 'Competent County',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 15,
    tags: [
      {
        id: 'nop-567',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'qrs-345',
    createdAt: '2023-11-03T20:19:11.724Z',
    updatedAt: '2023-11-03T20:19:11.724Z',
    name: 'Condescending City',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 14,
    tags: [
      {
        id: 'tuv-678',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'wxy-789',
    createdAt: '2023-11-03T20:19:08.930Z',
    updatedAt: '2023-11-03T20:19:08.930Z',
    name: 'Distracted Agency',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    tags: [
      {
        id: 'efg-567',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'hij-123',
    createdAt: '2023-11-03T20:19:07.901Z',
    updatedAt: '2023-11-03T20:19:07.901Z',
    name: 'Optimistic County',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 12,
    tags: [
      {
        id: 'cde-234',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'rst-123',
    createdAt: '2023-11-03T20:19:10.343Z',
    updatedAt: '2023-11-03T20:19:10.343Z',
    name: 'Peaceful Department',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 0,
    tags: [
      {
        id: 'efg-567',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'klm-456',
    createdAt: '2023-11-03T20:19:11.296Z',
    updatedAt: '2023-11-03T20:19:11.296Z',
    name: 'Sharp County',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 30,
    tags: [
      {
        id: 'lmn-567',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'ghi-678',
    createdAt: '2023-11-03T20:19:06.677Z',
    updatedAt: '2023-11-03T20:19:06.677Z',
    name: 'Tender Department',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 10,
    tags: [
      {
        id: 'ijk-789',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  },
  {
    id: 'mno-345',
    createdAt: '2023-11-03T20:19:09.380Z',
    updatedAt: '2023-11-03T20:19:09.380Z',
    name: 'Zealous Agency',
    rootDomains: ['crossfeed.local'],
    ipBlocks: [],
    isPassive: false,
    pendingDomains: [],
    userRoles: [],
    members: 3,
    tags: [
      {
        id: 'stu-234',
        createdAt: '2023-10-03T20:38:45.889Z',
        updatedAt: '2023-10-03T20:38:45.889Z',
        name: 'Sample Data'
      }
    ]
  }
];
