import { handler as censysIpv4 } from '../censysIpv4';
import * as zlib from 'zlib';
import * as nock from 'nock';
import * as path from 'path';
import * as fs from 'fs';

jest.mock('../helpers/getCensysIpv4Data');
jest.mock('../helpers/saveDomainsToDb');
jest.mock('../helpers/saveServicesToDb');
jest.mock('../helpers/getAllDomains');

const RealDate = Date;

describe('censys ipv4', () => {
  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  test('basic test', async () => {
    nock('https://censys.io')
      .get('/api/v1/data/ipv4_2018/')
      .reply(200, {
        results: {
          latest: {
            details_url: 'https://censys.io/api/v1/data/ipv4_2018/20200719'
          }
        }
      });
    nock('https://censys.io')
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
            body:
              '﻿<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\r\n<html xmlns="http://www.w3.org/1999/xhtml">\r'
          }
        }
      },
      tags: ['dns']
    });

    nock('https://data-01.censys.io')
      .get('/snapshots/ipv4/20200719/first_file.json.gz')
      .reply(200, zlib.gzipSync(firstFileContents))
      .get('/snapshots/ipv4/20200719/second_file.json.gz')
      .reply(200, zlib.gzipSync(secondFileContents));
    jest.setTimeout(30000);
    await censysIpv4({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
  });
});
