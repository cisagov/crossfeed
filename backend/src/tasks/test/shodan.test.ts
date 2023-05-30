import * as nock from 'nock';
import {
  connectToDatabase,
  Domain,
  Organization,
  Scan,
  Service,
  Vulnerability
} from '../../models';
import { handler as shodan } from '../shodan';

const RealDate = Date;

const shodanResponse = [
  {
    region_code: null,
    ip: 2575209532,
    postal_code: null,
    country_code: 'JP',
    city: null,
    dma_code: null,
    last_update: '2020-12-16T20:00:25.339321',
    latitude: 35.69,
    tags: ['self-signed', 'starttls'],
    area_code: null,
    country_name: 'Japan',
    hostnames: ['otakukonkatsu.com'],
    org: 'SAKURA Internet',
    data: [
      {
        hash: -1790423402,
        os: null,
        tags: ['self-signed'],
        opts: {
          vulns: [],
          heartbleed: '2020/12/16 20:00:12 153.126.148.60:993 - SAFE\n'
        },
        ip: 2575209532,
        isp: 'SAKURA Internet',
        port: 993,
        hostnames: ['otakukonkatsu.com'],
        timestamp: '2020-12-16T20:00:25.339321',
        domains: ['otakukonkatsu.com'],
        org: 'SAKURA Internet',
        data: '* OK [CAPABILITY IMAP4rev1 LITERAL+ SASL-IR LOGIN-REFERRALS ID ENABLE IDLE AUTH=PLAIN AUTH=LOGIN] Dovecot ready.\n* CAPABILITY IMAP4rev1 LITERAL+ SASL-IR LOGIN-REFERRALS ID ENABLE IDLE AUTH=PLAIN AUTH=LOGIN\r\nA001 OK Capability completed.\r\n* ID NIL\r\nA002 OK ID completed.\r\nA003 BAD Error in IMAP command received by server.\r\n',
        asn: 'AS7684',
        transport: 'tcp',
        ip_str: '153.126.148.60',
        product: 'Test',
        version: '1.1',
        cpe: ['cpe:/a:igor_sysoev:nginx:1.18.0', 'cpe:/a:atlassian:confluence']
      }
    ],
    asn: 'AS7684',
    isp: 'SAKURA Internet',
    longitude: 139.69,
    country_code3: null,
    domains: ['otakukonkatsu.com'],
    ip_str: '153.126.148.60',
    os: null,
    ports: [993, 587, 110, 80, 465, 25, 443]
  },
  {
    region_code: null,
    ip: 16843009,
    postal_code: null,
    country_code: 'AU',
    city: null,
    dma_code: null,
    last_update: '2020-12-21T22:04:16.508070',
    latitude: -33.494,
    tags: [],
    area_code: null,
    country_name: 'Australia',
    hostnames: ['one.one.one.one'],
    org: 'Mountain View Communications',
    data: [
      {
        _shodan: {
          id: '8eb5fb82-81c8-4a6d-bc20-43d83079069b',
          options: {},
          ptr: true,
          module: 'dns-udp',
          crawler: '70752434fdf0dcec35df6ae02b9703eaae035f7d'
        },
        hash: 1592421393,
        os: null,
        opts: {
          raw: '34ef818500010000000000000776657273696f6e0462696e640000100003'
        },
        ip: 16843009,
        isp: 'Mountain View Communications',
        port: 53,
        hostnames: ['one.one.one.one'],
        location: {
          city: null,
          region_code: null,
          area_code: null,
          longitude: 143.2104,
          country_code3: null,
          country_name: 'Australia',
          postal_code: null,
          dma_code: null,
          country_code: 'AU',
          latitude: -33.494
        },
        dns: {
          resolver_hostname: null,
          recursive: true,
          resolver_id: 'AMS',
          software: null
        },
        timestamp: '2020-12-21T22:04:16.508070',
        domains: ['one.one'],
        org: 'Mountain View Communications',
        data: '\nRecursion: enabled\nResolver ID: AMS',
        asn: 'AS13335',
        transport: 'udp',
        ip_str: '1.1.1.1',
        vulns: {
          'CVE-1234-1234': {
            verified: true,
            references: [],
            cvss: '5',
            summary: 'A vulnerability'
          }
        }
      }
    ],
    asn: 'AS13335',
    isp: 'Mountain View Communications',
    longitude: 143.2104,
    country_code3: null,
    domains: ['one.one'],
    ip_str: '1.1.1.1',
    os: null,
    ports: [53]
  }
];

describe('shodan', () => {
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
      name: 'shodan',
      arguments: {},
      frequency: 999
    }).save();
    domains = [
      await Domain.create({
        name: 'first_file_testdomain1',
        ip: '153.126.148.60',
        organization
      }).save(),
      await Domain.create({
        name: 'first_file_testdomain2',
        ip: '31.134.10.156',
        organization
      }).save(),
      await Domain.create({
        name: 'first_file_testdomain12',
        ip: '1.1.1.1',
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
    nock('https://api.shodan.io')
      .get(
        `/shodan/host/153.126.148.60,31.134.10.156,1.1.1.1?key=${process.env.SHODAN_API_KEY}`
      )
      .reply(200, shodanResponse);
    await shodan({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    await checkDomains(organization);
  });
  test('creates vulnerability', async () => {
    nock('https://api.shodan.io')
      .get(
        `/shodan/host/153.126.148.60,31.134.10.156,1.1.1.1?key=${process.env.SHODAN_API_KEY}`
      )
      .reply(200, shodanResponse);
    await shodan({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const domain = await Domain.findOne({ id: domains[2].id });
    const vulns = await Vulnerability.find({
      domain: domain
    });
    expect(vulns).toHaveLength(1);
    expect(vulns[0].title).toEqual('CVE-1234-1234');
  });
  test('updates existing vulnerability', async () => {
    const domain = await Domain.findOne({ id: domains[2].id });
    const service = await Service.create({
      domain,
      port: 443
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-1234-1234',
      lastSeen: new Date(Date.now()),
      cpe: 'cpe1',
      title: 'CVE-1234-1234',
      description: '123',
      state: 'closed',
      substate: 'remediated',
      source: 'cpe2cve',
      service
    }).save();
    nock('https://api.shodan.io')
      .get(
        `/shodan/host/153.126.148.60,31.134.10.156,1.1.1.1?key=${process.env.SHODAN_API_KEY}`
      )
      .reply(200, shodanResponse);
    await shodan({
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
    expect(vulns[0].title).toEqual('CVE-1234-1234');
    expect(vulns[0].id).toEqual(vulnerability.id);
    expect(vulns[0].cpe).toEqual(vulnerability.cpe);
    expect(vulns[0].state).toEqual(vulnerability.state);
    expect(vulns[0].service.id).toEqual(service.id);
    expect(vulns[0].source).toEqual(vulnerability.source);

    // These fields should be updated
    expect(vulns[0].cvss).toEqual('5');
    expect(vulns[0].updatedAt).not.toEqual(vulnerability.updatedAt);
  });
  test('populates shodanResults and products', async () => {
    nock('https://api.shodan.io')
      .get(
        `/shodan/host/153.126.148.60,31.134.10.156,1.1.1.1?key=${process.env.SHODAN_API_KEY}`
      )
      .reply(200, shodanResponse);
    await shodan({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const service = await Service.findOne({ domain: domains[0], port: 993 });
    expect(service).not.toBeUndefined();
    expect(service!.shodanResults).toEqual({
      product: 'Test',
      version: '1.1',
      cpe: ['cpe:/a:igor_sysoev:nginx:1.18.0', 'cpe:/a:atlassian:confluence']
    });
    expect(service!.products).toHaveLength(2);
    expect(service!.products).toEqual([
      {
        cpe: 'cpe:/a:igor_sysoev:nginx:1.18.0',
        name: 'nginx',
        tags: [],
        vendor: 'igor sysoev',
        version: '1.18.0'
      },
      {
        cpe: 'cpe:/a:atlassian:confluence',
        name: 'confluence',
        tags: [],
        vendor: 'atlassian'
      }
    ]);
  });
});
