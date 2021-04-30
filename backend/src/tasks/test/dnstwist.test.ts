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
  beforeAll(async () => {
    (spawnSync as jest.Mock).mockImplementation(() => ({
      status: 0,
      signal: null,
      output: [null, '', ''],
      pid: 3,
      stdout: `[
                {
                    "fuzzer": "Homoglyph",
                    "domain-name": "test-domain.one",
                    "dns-a": ["21.22.23.24"]
                },
                {
                    "fuzzer": "Original",
                    "domain-name": "test-domain.two",
                    "dns-a": ["01.02.03.04"],
                    "dns-mx": ["localhost"]
                },
                {
                    "fuzzer": "tls",
                    "domain-name": "test-domain.three",
                    "dns-a": ["10.11.12.13"],
                    "dns-ns": ["example.link"]
                }
            ]`,
      stderr: ''
    }));
  });
  beforeEach(async () => {
    await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
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
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    await checkDomains(organization);
  });

  test('creates vulnerability', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
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

    expect(vuln[0].title).toEqual('DNSTwist Domains');
    expect(vuln).toHaveLength(1);
    expect(vuln[0].source).toEqual('dnstwist');
  });
});
