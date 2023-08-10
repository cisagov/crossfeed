import { getLiveWebsites, LiveDomain } from '../helpers/getLiveWebsites';
import {
  connectToDatabase,
  Domain,
  Organization,
  Scan,
  Service,
  Vulnerability
} from '../../models';
import { CommandOptions } from '../ecs-client';
import { handler as hibp } from '../hibp';
import * as nock from 'nock';

const RealDate = Date;

const axios = require('axios');

const hibpResponse_1 = {
  testEmail_1: ['Breach_1'],
  testEmail_2: ['Breach_4'],
  testEmail_3: ['Breach_3'],
  testEmail_4: ['Breach_4'],
  testEmail_5: ['Breach_2'],
  testEmail_6: ['Breach_2'],
  testEmail_7: ['Breach_5'],
  testEmail_8: ['Breach_5'],
  testEmail_9: ['Breach_6']
};

const hibpResponse_2 = { testEmail_10: ['Breach_7'] };

const hibpResponse_3 = {};

const breachResponse = [
  {
    Name: 'Breach_1',
    Title: 'Breach_1',
    Domain: 'Breach_1.com',
    BreachDate: '2017-02-01',
    AddedDate: '2017-10-26T23:35:45Z',
    ModifiedDate: '2017-12-10T21:44:27Z',
    PwnCount: 8393093,
    Description: 'Mock Breach number 1',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_1.png',
    DataClasses: ['Email addresses', 'IP addresses', 'Names', 'Passwords'],
    IsVerified: true,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_2',
    Title: 'Breach_2',
    Domain: 'Breach_2.com',
    BreachDate: '2020-03-22',
    AddedDate: '2020-11-15T00:59:50Z',
    ModifiedDate: '2020-11-15T01:07:10Z',
    PwnCount: 8661578,
    Description: 'Mock Breach number 2',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_2.png',
    DataClasses: [
      'Email addresses',
      'IP addresses',
      'Names',
      'Passwords',
      'Phone numbers',
      'Physical addresses',
      'Usernames'
    ],
    IsVerified: true,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_3',
    Title: 'Breach_3',
    Domain: 'Breach_3.com',
    BreachDate: '2012-01-01',
    AddedDate: '2016-10-08T07:46:05Z',
    ModifiedDate: '2016-10-08T07:46:05Z',
    PwnCount: 6414191,
    Description: 'Mock Breach number 3',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_3.png',
    DataClasses: ['Email addresses', 'Passwords'],
    IsVerified: false,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_4',
    Title: 'Breach_4',
    Domain: 'Breach_4.com',
    BreachDate: '2016-04-19',
    AddedDate: '2016-07-08T01:55:03Z',
    ModifiedDate: '2016-07-08T01:55:03Z',
    PwnCount: 4009640,
    Description: 'Mock Breach number 4',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_4.png',
    DataClasses: [
      'Device information',
      'Email addresses',
      'IP addresses',
      'Passwords',
      'Usernames'
    ],
    IsVerified: true,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_5',
    Title: 'Breach_5',
    Domain: 'Breach_5.com',
    BreachDate: '2018-02-29',
    AddedDate: '2018-07-08T01:55:03Z',
    ModifiedDate: '2018-07-08T01:55:03Z',
    PwnCount: 389292,
    Description: 'Mock Breach number 5',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_4.png',
    DataClasses: ['Email addresses', 'IP addresses', 'Passwords', 'Usernames'],
    IsVerified: true,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_6',
    Title: 'Breach_6',
    Domain: 'Breach_6.com',
    BreachDate: '2017-01-22',
    AddedDate: '2017-03-08T01:55:03Z',
    ModifiedDate: '2017-03-08T01:55:03Z',
    PwnCount: 7829238,
    Description: 'Mock Breach number 6',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_4.png',
    DataClasses: ['Device information', 'Email addresses', 'IP addresses'],
    IsVerified: true,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  },
  {
    Name: 'Breach_7',
    Title: 'Breach_7',
    Domain: 'Breach_7.com',
    BreachDate: '2017-01-01',
    AddedDate: '2017-10-08T07:46:05Z',
    ModifiedDate: '2017-10-08T07:46:05Z',
    PwnCount: 3929020,
    Description: 'Mock Breach number 7',
    LogoPath:
      'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_3.png',
    DataClasses: ['Email addresses', 'Passwords'],
    IsVerified: false,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false
  }
];

describe('hibp', () => {
  let organization;
  let scan;
  let domains: Domain[] = [];
  let connection;
  beforeEach(async () => {
    connection = await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'hibp',
      arguments: {},
      frequency: 999
    }).save();
    domains = [
      await Domain.create({
        name: 'test-domain_1.gov',
        ip: '',
        organization
      }).save(),
      await Domain.create({
        name: 'test-domain_2.gov',
        ip: '',
        organization
      }).save(),
      await Domain.create({
        name: 'test-domain_3.gov',
        ip: '',
        organization
      }).save()
    ];

    jest.mock('../helpers/getIps', () => domains);
  });

  afterEach(async () => {
    global.Date = RealDate;
    jest.unmock('../helpers/getIps');
    await connection.close();
  });
  afterAll(async () => {
    nock.cleanAll();
  });
  const checkDomains = async (organization) => {
    const domains = await Domain.find({
      where: { organization },
      relations: ['organization', 'services']
    });
    expect(
      domains
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({
          ...e,
          services: e.services.map((s) => ({
            ...s,
            id: null,
            updatedAt: null,
            createdAt: null
          })),
          organization: null,
          id: null,
          updatedAt: null,
          createdAt: null,
          syncedAt: null,
          name: null
        }))
    ).toMatchSnapshot();
    expect(domains.filter((e) => !e.organization).length).toEqual(0);
  };
  test('basic test', async () => {
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_1.gov')
      .reply(200, hibpResponse_1);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/breaches')
      .reply(200, breachResponse);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_2.gov')
      .reply(200, hibpResponse_2);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_3.gov')
      .reply(200, hibpResponse_3);
    await hibp({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    await checkDomains(organization);
  });
  test('creates vulnerability', async () => {
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_1.gov')
      .reply(200, hibpResponse_1);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/breaches')
      .reply(200, breachResponse);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_2.gov')
      .reply(200, hibpResponse_2);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_3.gov')
      .reply(200, hibpResponse_3);
    await hibp({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const domain = await Domain.findOne({ id: domains[0].id });
    const vulns = await Vulnerability.find({
      domain: domain
    });
    expect(vulns).toHaveLength(1);
    expect(vulns[0].title).toEqual('Exposed Emails');
    expect(vulns[0].source).toEqual('hibp');
  });
  test('updates existing vulnerability', async () => {
    const domain = await Domain.findOne({ id: domains[0].id });
    const service = await Service.create({
      domain,
      port: 443
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: null,
      lastSeen: new Date(Date.now()),
      cpe: null,
      title: `Exposed Emails`,
      description: '123',
      state: 'closed',
      structuredData: {
        emails: {
          testEmail_1: ['Breach_1'],
          testEmail_2: ['Breach_2'],
          testEmail_3: ['Breach_3'],
          testEmail_4: ['Breach_4']
        },
        breaches: {
          breach_1: {
            Name: 'Breach_1',
            Title: 'Breach_1',
            Domain: 'Breach_1.com',
            BreachDate: '2017-02-01',
            AddedDate: '2017-10-26T23:35:45Z',
            ModifiedDate: '2017-12-10T21:44:27Z',
            PwnCount: 8393093,
            Description: 'Mock Breach number 1',
            LogoPath:
              'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_1.png',
            DataClasses: [
              'Email addresses',
              'IP addresses',
              'Names',
              'Passwords'
            ],
            IsVerified: true,
            IsFabricated: false,
            IsSensitive: false,
            IsRetired: false,
            IsSpamList: false
          },
          Breach_2: {
            Name: 'Breach_2',
            Title: 'Breach_2',
            Domain: 'Breach_2.com',
            BreachDate: '2020-03-22',
            AddedDate: '2020-11-15T00:59:50Z',
            ModifiedDate: '2020-11-15T01:07:10Z',
            PwnCount: 8661578,
            Description: 'Mock Breach number 2',
            LogoPath:
              'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_2.png',
            DataClasses: [
              'Email addresses',
              'IP addresses',
              'Names',
              'Passwords',
              'Phone numbers',
              'Physical addresses',
              'Usernames'
            ],
            IsVerified: true,
            IsFabricated: false,
            IsSensitive: false,
            IsRetired: false,
            IsSpamList: false
          },
          Breach_3: {
            Name: 'Breach_3',
            Title: 'Breach_3',
            Domain: 'Breach_3.com',
            BreachDate: '2012-01-01',
            AddedDate: '2016-10-08T07:46:05Z',
            ModifiedDate: '2016-10-08T07:46:05Z',
            PwnCount: 6414191,
            Description: 'Mock Breach number 3',
            LogoPath:
              'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_3.png',
            DataClasses: ['Email addresses', 'Passwords'],
            IsVerified: false,
            IsFabricated: false,
            IsSensitive: false,
            IsRetired: false,
            IsSpamList: false
          },
          Breach_4: {
            Name: 'Breach_4',
            Title: 'Breach_4',
            Domain: 'Breach_4.com',
            BreachDate: '2016-04-19',
            AddedDate: '2016-07-08T01:55:03Z',
            ModifiedDate: '2016-07-08T01:55:03Z',
            PwnCount: 4009640,
            Description: 'Mock Breach number 4',
            LogoPath:
              'https://haveibeenpwned.com/Content/Images/PwnedLogos/Breach_4.png',
            DataClasses: [
              'Device information',
              'Email addresses',
              'IP addresses',
              'Passwords',
              'Usernames'
            ],
            IsVerified: true,
            IsFabricated: false,
            IsSensitive: false,
            IsRetired: false,
            IsSpamList: false
          }
        }
      },
      substate: 'remediated',
      source: 'hibp'
    }).save();
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_1.gov')
      .reply(200, hibpResponse_1);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/breaches')
      .reply(200, breachResponse);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_2.gov')
      .reply(200, hibpResponse_2);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_3.gov')
      .reply(200, hibpResponse_3);
    await hibp({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const vulns = await Vulnerability.find({
      where: { domain },
      relations: ['service']
    });
    expect(vulns).toHaveLength(1);

    // These fields should stay the same
    expect(vulns[0].title).toEqual('Exposed Emails');
    expect(vulns[0].id).toEqual(vulnerability.id);
    expect(vulns[0].cpe).toEqual(vulnerability.cpe);
    expect(vulns[0].state).toEqual(vulnerability.state);
    expect(vulns[0].source).toEqual(vulnerability.source);

    // These fields should be updated
    expect(
      vulns[0].structuredData['emails']['testEmail_2@test-domain_1.gov']
    ).toEqual(['Breach_4']);
    expect(vulns[0].structuredData['breaches']['Breach_1']['PwnCount']).toEqual(
      8393093
    );
    expect(vulns[0].updatedAt).not.toEqual(vulnerability.updatedAt);
  });
  test('verify breaches without password are included', async () => {
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_1.gov')
      .reply(200, hibpResponse_1);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/breaches')
      .reply(200, breachResponse);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_2.gov')
      .reply(200, hibpResponse_2);
    nock('https://haveibeenpwned.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    })
      .get('/api/v2/enterprisesubscriber/domainsearch/test-domain_3.gov')
      .reply(200, hibpResponse_3);
    await hibp({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const domain = await Domain.findOne({ id: domains[0].id });
    const vulns = await Vulnerability.find({
      domain: domain
    });
    expect(vulns).toHaveLength(1);
    expect(vulns[0].title).toEqual('Exposed Emails');
    expect(vulns[0].source).toEqual('hibp');
    expect(vulns[0].structuredData['breaches']['Breach_6']).toBeTruthy();
    expect(
      vulns[0].structuredData['breaches']['Breach_6'].passwordIncluded
    ).toEqual(false);
  });
});
