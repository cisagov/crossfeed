import { handler as dnstwist } from '../dnstwist';
import {
  connectToDatabase,
  Organization,
  Domain,
  Scan,
  Vulnerability
} from '../../models';
import { spawnSync } from 'child_process';

const RealDate = Date;

jest.mock('child_process', () => ({
  spawnSync: jest.fn()
}));

describe('dnstwist', () => {
  let scan;
  let organization;
  const domains: Domain[] = [];
  let connection;
  beforeAll(async () => {
    (spawnSync as jest.Mock).mockImplementation(() => ({
      status: 0,
      signal: null,
      output: [null, '', ''],
      pid: 3,
      stdout: `[
                {
                    "fuzzer": "Homoglyph",
                    "domain": "test-domain.one",
                    "dns_a": ["21.22.23.24"]
                },
                {
                    "fuzzer": "Original",
                    "domain": "test-domain.two",
                    "dns_a": ["01.02.03.04"],
                    "dns_mx": ["localhost"]
                },
                {
                    "fuzzer": "tls",
                    "domain": "test-domain.three",
                    "dns_a": ["10.11.12.13"],
                    "dns_ns": ["example.link"]
                }
            ]`,
      stderr: ''
    }));
  });
  beforeEach(async () => {
    connection = await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-root-domain'],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'dnstwist',
      arguments: {},
      frequency: 999
    }).save();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    jest.mock('../helpers/getIps', () => domains);
  });

  afterEach(() => {
    global.Date = RealDate;
    jest.unmock('../helpers/getIps');
    connection.close();
  });

  test('basic test', async () => {
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      ip: '0.0.0.0',
      organization
    }).save();
    const vulns = await Vulnerability.find({
      domain: domain
    });
    expect(vulns.length).toEqual(0);
  });

  test('creates vulnerability', async () => {
    const name = 'test-root-domain';
    const domain = await Domain.create({
      name,
      ip: '0.0.0.0',
      organization
    }).save();

    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.find({
      domain: domain
    });

    expect(vuln[0].title).toEqual('DNS Twist Domains');
    expect(vuln).toHaveLength(1);
    expect(vuln[0].source).toEqual('dnstwist');
    const results = {
      domains: [
        {
          fuzzer: 'Homoglyph',
          domain: 'test-domain.one',
          dns_a: ['21.22.23.24'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'Original',
          domain: 'test-domain.two',
          dns_a: ['01.02.03.04'],
          dns_mx: ['localhost'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'tls',
          domain: 'test-domain.three',
          dns_a: ['10.11.12.13'],
          dns_ns: ['example.link'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        }
      ]
    };
    expect(vuln[0].structuredData).toEqual(results);
  });
  test('does not run on sub-domains, only roots', async () => {
    const name = 'test-root-domain';
    const root_domain = await Domain.create({
      name,
      ip: '0.0.0.0',
      organization
    }).save();

    const sub_name = 'test-sub-domain';
    const sub_domain = await Domain.create({
      name: sub_name,
      ip: '10.20.30.40',
      organization
    }).save();

    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const root_vuln = await Vulnerability.find({
      domain: root_domain
    });
    const sub_vuln = await Vulnerability.find({
      domain: sub_domain
    });
    expect(sub_vuln).toHaveLength(0);
    expect(root_vuln).toHaveLength(1);
    expect(root_vuln[0].title).toEqual('DNS Twist Domains');
    expect(root_vuln[0].source).toEqual('dnstwist');
  });
  test('root domain not in the domains table', async () => {
    const root_domain_name = 'test-root-domain';
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const root_domain = await Domain.findOne({
      name: root_domain_name
    });
    const root_vuln = await Vulnerability.find({
      domain: root_domain
    });
    expect(root_vuln).toHaveLength(1);
    expect(root_vuln[0].title).toEqual('DNS Twist Domains');
    expect(root_vuln[0].source).toEqual('dnstwist');
  });
  test("adds new domains to existing dnstwist vulnerabilty and doesn't update the date of the existing one", async () => {
    const name = 'test-root-domain';
    const domain = await Domain.create({
      name,
      ip: '0.0.0.0',
      organization
    }).save();
    //represents the result of an older dnstwist run
    await Vulnerability.create({
      source: 'dnstwist',
      domain,
      title: 'DNS Twist Domains',
      structuredData: {
        domains: [
          {
            fuzzer: 'Homoglyph',
            domain: 'test-domain.one',
            dns_a: ['21.22.23.24'],
            date_first_observed: '2018-04-22T10:20:30.000Z'
          }
        ]
      }
    }).save();
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.find({
      domain: domain
    });
    expect(vuln[0].title).toEqual('DNS Twist Domains');
    expect(vuln).toHaveLength(1);
    expect(vuln[0].source).toEqual('dnstwist');
    const results = {
      domains: [
        {
          fuzzer: 'Homoglyph',
          domain: 'test-domain.one',
          dns_a: ['21.22.23.24'],
          date_first_observed: '2018-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'Original',
          domain: 'test-domain.two',
          dns_a: ['01.02.03.04'],
          dns_mx: ['localhost'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'tls',
          domain: 'test-domain.three',
          dns_a: ['10.11.12.13'],
          dns_ns: ['example.link'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        }
      ]
    };
    expect(vuln[0].structuredData).toEqual(results);
  });
  test('removes dnstwist domain that no longer exists', async () => {
    const name = 'test-root-domain';
    const domain = await Domain.create({
      name,
      ip: '0.0.0.0',
      organization
    }).save();
    await Vulnerability.create({
      source: 'dnstwist',
      domain,
      title: 'DNS Twist Domains',
      structuredData: {
        domains: [
          {
            fuzzer: 'Homoglyph',
            domain: 'test-domain.one',
            dns_a: ['21.22.23.24'],
            date_first_observed: '2018-04-22T10:20:30.000Z'
          },
          {
            fuzzer: 'Homoglyph',
            domain: 'old.test-domain',
            dns_a: ['21.22.23.24'],
            date_first_observed: '2018-04-22T10:20:30.000Z'
          }
        ]
      }
    }).save();
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.find({
      domain: domain
    });
    expect(vuln[0].title).toEqual('DNS Twist Domains');
    expect(vuln).toHaveLength(1);
    expect(vuln[0].source).toEqual('dnstwist');
    const results = {
      domains: [
        {
          fuzzer: 'Homoglyph',
          domain: 'test-domain.one',
          dns_a: ['21.22.23.24'],
          date_first_observed: '2018-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'Original',
          domain: 'test-domain.two',
          dns_a: ['01.02.03.04'],
          dns_mx: ['localhost'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        },
        {
          fuzzer: 'tls',
          domain: 'test-domain.three',
          dns_a: ['10.11.12.13'],
          dns_ns: ['example.link'],
          date_first_observed: '2019-04-22T10:20:30.000Z'
        }
      ]
    };
    expect(vuln[0].structuredData).toEqual(results);
  });
});
