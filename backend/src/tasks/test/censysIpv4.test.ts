import { handler as censysIpv4 } from '../censysIpv4';
import * as zlib from 'zlib';
import * as nock from 'nock';
import * as path from 'path';
import * as fs from 'fs';
import { connectToDatabase, Domain, Organization, Scan } from '../../models';

const RealDate = Date;

const authHeaders = {
  reqheaders: {
    Authorization:
      'Basic ' +
      Buffer.from(
        `${process.env.CENSYS_API_ID}:${process.env.CENSYS_API_SECRET}`
      ).toString('base64')
  }
};

jest.setTimeout(30000);

describe('censys ipv4', () => {
  let organization;
  let scan;
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
      name: 'censysIpv4',
      arguments: {},
      frequency: 999
    }).save();
    await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain2',
      ip: '31.134.10.156',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain3',
      ip: '153.126.148.61',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain4',
      ip: '85.24.146.152',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain5',
      ip: '45.79.207.117',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain6',
      ip: '156.249.159.119',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain7',
      ip: '221.10.15.220',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain8',
      ip: '81.141.166.145',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain9',
      ip: '24.65.82.187',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain10',
      ip: '52.74.149.117',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain11',
      ip: '31.134.10.156',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain12',
      ip: '1.1.1.1',
      organization
    }).save();
  });

  afterEach(async () => {
    global.Date = RealDate;
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
          syncedAt: null
        }))
    ).toMatchSnapshot();
    expect(domains.filter((e) => !e.organization).length).toEqual(0);
  };

  test('basic test', async () => {
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018')
      .reply(200, {
        results: {
          latest: {
            details_url: 'https://censys.io/api/v1/data/ipv4_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018/20200719')
      .reply(200, {
        files: {
          'first_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/ipv4/20200719/first_file.json.gz'
          },
          'second_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/ipv4/20200719/second_file.json.gz'
          }
        }
      });
    const firstFileContents = fs.readFileSync(
      path.join(__dirname, '../helpers/__mocks__/censysIpv4Sample.json')
    );
    const secondFileContents = JSON.stringify({
      address: '1.1.1.1',
      ipint: '1319753985',
      updated_at: '2020-07-05T15:41:45Z',
      ip: '1.1.1.1',
      location: {
        country_code: 'TR',
        continent: 'Asia',
        city: 'Akalan',
        postal_code: '55400',
        timezone: 'Europe/Istanbul',
        province: 'Samsun',
        latitude: 41.2748,
        longitude: 35.7197,
        registered_country: 'Turkey',
        registered_country_code: 'TR',
        country: 'Turkey'
      },
      autonomous_system: {
        description: 'TTNET',
        routed_prefix: '78.169.128.0/17',
        asn: '9121',
        country_code: 'TR',
        name: 'TTNET',
        path: ['7018', '3320', '9121']
      },
      ports: ['53', '8080'],
      protocols: ['53/dns', '8080/http'],
      ipinteger: '31041870',
      version: '0',
      p53: {
        dns: {
          lookup: {
            errors: false,
            open_resolver: false,
            questions: [{ name: 'c.afekv.com', type: 'A' }],
            resolves_correctly: false,
            support: true,
            timestamp: '2020-07-05T15:41:45Z'
          }
        }
      },
      p8080: {
        http: {
          get: {
            body: `these characters should not show up in the snapshot:
              null: \u0000
              another null: \0
              another null: \\u0000
              `
          }
        }
      },
      tags: ['dns']
    });

    nock('https://data-01.censys.io', authHeaders)
      .persist()
      .get('/snapshots/ipv4/20200719/first_file.json.gz')
      .reply(200, zlib.gzipSync(firstFileContents))
      .get('/snapshots/ipv4/20200719/second_file.json.gz')
      .reply(200, zlib.gzipSync(secondFileContents));
    await censysIpv4({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });

    await checkDomains(organization);
  });

  test('http failure triggers retry', async () => {
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018')
      .reply(200, {
        results: {
          latest: {
            details_url: 'https://censys.io/api/v1/data/ipv4_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018/20200719')
      .reply(200, {
        files: {
          'failed_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/ipv4/20200719/failed_file.json.gz'
          }
        }
      });

    nock('https://data-01.censys.io')
      .get('/snapshots/ipv4/20200719/failed_file.json.gz')
      .reply(429, 'too many requests');

    nock('https://data-01.censys.io')
      .get('/snapshots/ipv4/20200719/failed_file.json.gz')
      .reply(200, zlib.gzipSync(JSON.stringify({})));

    jest.setTimeout(30000);
    await censysIpv4({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });

    await checkDomains(organization);
  });

  test('repeated http failures throw an error', async () => {
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018')
      .reply(200, {
        results: {
          latest: {
            details_url: 'https://censys.io/api/v1/data/ipv4_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/ipv4_2018/20200719')
      .reply(200, {
        files: {
          'failed_file_2.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/ipv4/20200719/failed_file_2.json.gz'
          }
        }
      });

    nock('https://data-01.censys.io')
      .persist()
      .get('/snapshots/ipv4/20200719/failed_file_2.json.gz')
      .reply(429, 'too many requests');

    jest.setTimeout(30000);
    await expect(
      censysIpv4({
        organizationId: organization.id,
        organizationName: 'organizationName',
        scanId: scan.id,
        scanName: 'scanName',
        scanTaskId: 'scanTaskId',
        chunkNumber: 0,
        numChunks: 1
      })
    ).rejects.toThrow('Response code 429');

    await checkDomains(organization);
  });
  test('undefined numChunks throws an error', async () => {
    await expect(
      censysIpv4({
        organizationId: organization.id,
        organizationName: 'organizationName',
        scanId: scan.id,
        scanName: 'scanName',
        scanTaskId: 'scanTaskId',
        chunkNumber: 0
      })
    ).rejects.toThrow('Chunks not specified.');
  });
  test('undefined chunkNumber throws an error', async () => {
    await expect(
      censysIpv4({
        organizationId: organization.id,
        organizationName: 'organizationName',
        scanId: scan.id,
        scanName: 'scanName',
        scanTaskId: 'scanTaskId',
        numChunks: 1
      })
    ).rejects.toThrow('Chunks not specified.');
  });
  test('chunkNumber >= numChunks throws an error', async () => {
    await expect(
      censysIpv4({
        organizationId: organization.id,
        organizationName: 'organizationName',
        scanId: scan.id,
        scanName: 'scanName',
        scanTaskId: 'scanTaskId',
        chunkNumber: 1,
        numChunks: 1
      })
    ).rejects.toThrow('Invalid chunk number.');
  });
  test('chunkNumber > 100 throws an error', async () => {
    await expect(
      censysIpv4({
        organizationId: organization.id,
        organizationName: 'organizationName',
        scanId: scan.id,
        scanName: 'scanName',
        scanTaskId: 'scanTaskId',
        chunkNumber: 101,
        numChunks: 100
      })
    ).rejects.toThrow('Invalid chunk number.');
  });
});
