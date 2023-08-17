import { handler as censysCertificates } from '../censysCertificates';
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

describe('censys certificates', () => {
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
      name: 'censysCertificates',
      arguments: {},
      frequency: 999
    }).save();
    await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization
    }).save();
    await Domain.create({
      name: 'subdomain.first_file_testdomain2.gov',
      ip: '31.134.10.156',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain3.gov',
      ip: '153.126.148.61',
      organization
    }).save();
    await Domain.create({
      name: 'subdomain.first_file_testdomain4.gov',
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
      .get('/api/v1/data/certificates_2018/')
      .reply(200, {
        results: {
          latest: {
            details_url:
              'https://censys.io/api/v1/data/certificates_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/certificates_2018/20200719')
      .reply(200, {
        files: {
          'first_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/certificates/20200719/first_file.json.gz'
          },
          'second_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/certificates/20200719/second_file.json.gz'
          }
        }
      });
    const firstFileContents = fs.readFileSync(
      path.join(__dirname, '../helpers/__mocks__/censysCertificatesSample.json')
    );
    const secondFileContents = JSON.stringify({
      parsed: {
        extensions: {
          authority_info_access: {
            issuer_urls: [
              'http://crt.comodoca4.com/COMODOECCDomainValidationSecureServerCA2.crt'
            ],
            ocsp_urls: ['http://ocsp.comodoca4.com']
          },
          authority_key_id: '40096167f0bc83714fde12082c6fd4d42b763d96',
          basic_constraints: {
            is_ca: false
          },
          certificate_policies: [
            {
              cps: ['https://secure.comodo.com/CPS'],
              id: '1.3.6.1.4.1.6449.1.2.2.7',
              user_notice: []
            },
            {
              cps: [],
              id: '2.23.140.1.2.1',
              user_notice: []
            }
          ],
          crl_distribution_points: [
            'http://crl.comodoca4.com/COMODOECCDomainValidationSecureServerCA2.crl'
          ],
          extended_key_usage: {
            client_auth: true,
            server_auth: true,
            unknown: [],
            value: []
          },
          key_usage: {
            digital_signature: true,
            value: '1'
          },
          signed_certificate_timestamps: [],
          subject_alt_name: {
            directory_names: [],
            dns_names: [
              'sni228711.cloudflaressl.com',
              '*.cialishintaapteekissa.nu',
              '*.diabeticmalesest.ga',
              '*.discountasphaltsest.cf',
              '*.discountasphaltsest.ga',
              '*.discountbreastsurgerysest.ga',
              '*.discountcreationssest.cf',
              '*.discountcreationssest.ga',
              '*.dogsweightsest.cf',
              '*.domainnamemdsest.cf',
              '*.domainspearsest.ga',
              '*.dotofferssest.cf',
              '*.downloadworkshopsest.cf',
              '*.drivelongsest.ga',
              '*.dummycoursessest.cf',
              '*.earlyclearancesest.ga',
              '*.ebizstudentsest.cf',
              '*.egocheckersest.cf',
              '*.electronicspatrolsest.ga',
              '*.emotionblogsest.cf',
              '*.eternalvitaminsest.cf',
              '*.eugenetravelagencysest.cf',
              '*.euroclassessest.ga',
              '*.exhaustcleanersest.cf',
              '*.exhaustcleanersest.ga',
              '*.factoringratesest.cf',
              '*.gan-info.cf',
              '*.kanboard.net',
              '*.kanboard.org',
              '*.kidsmental.cf',
              '*.miniflux.net',
              '*.quocanhartsit-malay.tk',
              '*.taybactravel-cr.tk',
              '*.taybactravel-malay.tk',
              'cialishintaapteekissa.nu',
              'diabeticmalesest.ga',
              'discountasphaltsest.cf',
              'discountasphaltsest.ga',
              'discountbreastsurgerysest.ga',
              'discountcreationssest.cf',
              'discountcreationssest.ga',
              'dogsweightsest.cf',
              'domainnamemdsest.cf',
              'domainspearsest.ga',
              'dotofferssest.cf',
              'downloadworkshopsest.cf',
              'drivelongsest.ga',
              'dummycoursessest.cf',
              'earlyclearancesest.ga',
              'ebizstudentsest.cf',
              'egocheckersest.cf',
              'electronicspatrolsest.ga',
              'emotionblogsest.cf',
              'eternalvitaminsest.cf',
              'eugenetravelagencysest.cf',
              'euroclassessest.ga',
              'exhaustcleanersest.cf',
              'exhaustcleanersest.ga',
              'factoringratesest.cf',
              'gan-info.cf',
              'kanboard.net',
              'kanboard.org',
              'kidsmental.cf',
              'miniflux.net',
              'quocanhartsit-malay.tk',
              'taybactravel-cr.tk',
              'taybactravel-malay.tk'
            ],
            edi_party_names: [],
            email_addresses: [],
            ip_addresses: [],
            other_names: [],
            registered_ids: [],
            uniform_resource_identifiers: []
          },
          subject_key_id: 'de3659c76fb0c533f364dea33cff62b1550f114e'
        },
        fingerprint_md5: 'f3849febffbcc302bff7f1ebe70cf541',
        fingerprint_sha1: 'f0c0ccafbd23229304fd96d31bcf80e5e720fa47',
        fingerprint_sha256:
          '2f593d42bfc72fc72ee0c02616dbc9c6bb0eec4cd05955aa817ee363fc61298a',
        issuer: {
          common_name: ['COMODO ECC Domain Validation Secure Server CA 2'],
          country: ['GB'],
          domain_component: [],
          email_address: [],
          given_name: [],
          jurisdiction_country: [],
          jurisdiction_locality: [],
          jurisdiction_province: [],
          locality: ['Salford'],
          organization: ['COMODO CA Limited'],
          organization_id: [],
          organizational_unit: [],
          postal_code: [],
          province: ['Greater Manchester'],
          serial_number: [],
          street_address: [],
          surname: []
        },
        issuer_dn:
          'C=GB, ST=Greater Manchester, L=Salford, O=COMODO CA Limited, CN=COMODO ECC Domain Validation Secure Server CA 2',
        names: ['first_file_testdomain1'],
        redacted: false,
        serial_number: '120208144154356728597551522169858315749',
        signature: {
          self_signed: false,
          signature_algorithm: {
            name: 'ECDSA-SHA256',
            oid: '1.2.840.10045.4.3.2'
          },
          valid: false,
          value:
            'MEQCIB25v+hk4BJJcgoD5oxv4YcPKmSdeYPW6cWJzrVGAy2tAiBtbLLS1Xrsit3yV5e75Erdd887AaJuZ60es1c509K71A=='
        },
        signature_algorithm: {
          name: 'ECDSA-SHA256',
          oid: '1.2.840.10045.4.3.2'
        },
        spki_subject_fingerprint:
          'f4ac87703f7604973bc6b14cbf6fcf4c8897b21593b68932537ddf0b567e027f',
        subject: {
          common_name: ['sni228711.cloudflaressl.com'],
          country: [],
          domain_component: [],
          email_address: [],
          given_name: [],
          jurisdiction_country: [],
          jurisdiction_locality: [],
          jurisdiction_province: [],
          locality: [],
          organization: [],
          organization_id: [],
          organizational_unit: [
            'Domain Control Validated',
            'PositiveSSL Multi-Domain'
          ],
          postal_code: [],
          province: [],
          serial_number: [],
          street_address: [],
          surname: []
        },
        subject_dn:
          'OU=Domain Control Validated, OU=PositiveSSL Multi-Domain, CN=sni228711.cloudflaressl.com',
        subject_key_info: {
          ecdsa_public_key: {
            b: 'WsY12Ko6k+ez671VdpiGvGUdBrDMU7D2O848PifSYEs=',
            curve: 'P-256',
            gx: 'axfR8uEsQkf4vOblY6RA8ncDfYEt6zOg9KE5RdiYwpY=',
            gy: 'T+NC4v4af5uO5+tKfA+eFivOM1drMV7Oy7ZAaDe/UfU=',
            length: '256',
            n: '/////wAAAAD//////////7zm+q2nF56E87nKwvxjJVE=',
            p: '/////wAAAAEAAAAAAAAAAAAAAAD///////////////8=',
            pub: 'BK/RnLux41uEKK+IpV0Dz9URFUwMC2cUlhJHvd/GZdKqgibn3YzzeEyiIUwHjnHuEgLRI6DfSFtGHBFYYw0rQsM=',
            x: 'r9Gcu7HjW4Qor4ilXQPP1REVTAwLZxSWEke938Zl0qo=',
            y: 'gibn3YzzeEyiIUwHjnHuEgLRI6DfSFtGHBFYYw0rQsM='
          },
          fingerprint_sha256:
            '67d6dfd2e0d8114b592654cf75ec384ee4b6e3fce8751897eab1b85843d3990c',
          key_algorithm: {
            name: 'ECDSA'
          }
        },
        tbs_fingerprint:
          '0ee2b5cb0e1d338cbc7a0e4dabe0339109e8a39fbad704367f9c89d604234a2a',
        tbs_noct_fingerprint:
          '0ee2b5cb0e1d338cbc7a0e4dabe0339109e8a39fbad704367f9c89d604234a2a',
        unknown_extensions: [],
        validation_level: 'DV',
        validity: {
          end: '2018-09-25 23:59:59 UTC',
          length: '16502399',
          start: '2018-03-19 00:00:00 UTC'
        },
        version: '3'
      },
      precert: false,
      raw: 'MIIJnzCCCUagAwIBAgIQWm8/FpnHc6HzjByfs1xV5TAKBggqhkjOPQQDAjCBkjELMAkGA1UEBhMCR0IxGzAZBgNVBAgTEkdyZWF0ZXIgTWFuY2hlc3RlcjEQMA4GA1UEBxMHU2FsZm9yZDEaMBgGA1UEChMRQ09NT0RPIENBIExpbWl0ZWQxODA2BgNVBAMTL0NPTU9ETyBFQ0MgRG9tYWluIFZhbGlkYXRpb24gU2VjdXJlIFNlcnZlciBDQSAyMB4XDTE4MDMxOTAwMDAwMFoXDTE4MDkyNTIzNTk1OVowbDEhMB8GA1UECxMYRG9tYWluIENvbnRyb2wgVmFsaWRhdGVkMSEwHwYDVQQLExhQb3NpdGl2ZVNTTCBNdWx0aS1Eb21haW4xJDAiBgNVBAMTG3NuaTIyODcxMS5jbG91ZGZsYXJlc3NsLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABK/RnLux41uEKK+IpV0Dz9URFUwMC2cUlhJHvd/GZdKqgibn3YzzeEyiIUwHjnHuEgLRI6DfSFtGHBFYYw0rQsOjggehMIIHnTAfBgNVHSMEGDAWgBRACWFn8LyDcU/eEggsb9TUK3Y9ljAdBgNVHQ4EFgQU3jZZx2+wxTPzZN6jPP9isVUPEU4wDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCME8GA1UdIARIMEYwOgYLKwYBBAGyMQECAgcwKzApBggrBgEFBQcCARYdaHR0cHM6Ly9zZWN1cmUuY29tb2RvLmNvbS9DUFMwCAYGZ4EMAQIBMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9jcmwuY29tb2RvY2E0LmNvbS9DT01PRE9FQ0NEb21haW5WYWxpZGF0aW9uU2VjdXJlU2VydmVyQ0EyLmNybDCBiAYIKwYBBQUHAQEEfDB6MFEGCCsGAQUFBzAChkVodHRwOi8vY3J0LmNvbW9kb2NhNC5jb20vQ09NT0RPRUNDRG9tYWluVmFsaWRhdGlvblNlY3VyZVNlcnZlckNBMi5jcnQwJQYIKwYBBQUHMAGGGWh0dHA6Ly9vY3NwLmNvbW9kb2NhNC5jb20wggXoBgNVHREEggXfMIIF24Ibc25pMjI4NzExLmNsb3VkZmxhcmVzc2wuY29tghoqLmNpYWxpc2hpbnRhYXB0ZWVraXNzYS5udYIVKi5kaWFiZXRpY21hbGVzZXN0LmdhghgqLmRpc2NvdW50YXNwaGFsdHNlc3QuY2aCGCouZGlzY291bnRhc3BoYWx0c2VzdC5nYYIeKi5kaXNjb3VudGJyZWFzdHN1cmdlcnlzZXN0LmdhghoqLmRpc2NvdW50Y3JlYXRpb25zc2VzdC5jZoIaKi5kaXNjb3VudGNyZWF0aW9uc3Nlc3QuZ2GCEyouZG9nc3dlaWdodHNlc3QuY2aCFSouZG9tYWlubmFtZW1kc2VzdC5jZoIUKi5kb21haW5zcGVhcnNlc3QuZ2GCEiouZG90b2ZmZXJzc2VzdC5jZoIZKi5kb3dubG9hZHdvcmtzaG9wc2VzdC5jZoISKi5kcml2ZWxvbmdzZXN0LmdhghUqLmR1bW15Y291cnNlc3Nlc3QuY2aCFyouZWFybHljbGVhcmFuY2VzZXN0LmdhghQqLmViaXpzdHVkZW50c2VzdC5jZoITKi5lZ29jaGVja2Vyc2VzdC5jZoIaKi5lbGVjdHJvbmljc3BhdHJvbHNlc3QuZ2GCFCouZW1vdGlvbmJsb2dzZXN0LmNmghcqLmV0ZXJuYWx2aXRhbWluc2VzdC5jZoIbKi5ldWdlbmV0cmF2ZWxhZ2VuY3lzZXN0LmNmghQqLmV1cm9jbGFzc2Vzc2VzdC5nYYIXKi5leGhhdXN0Y2xlYW5lcnNlc3QuY2aCFyouZXhoYXVzdGNsZWFuZXJzZXN0LmdhghYqLmZhY3RvcmluZ3JhdGVzZXN0LmNmgg0qLmdhbi1pbmZvLmNmgg4qLmthbmJvYXJkLm5ldIIOKi5rYW5ib2FyZC5vcmeCDyoua2lkc21lbnRhbC5jZoIOKi5taW5pZmx1eC5uZXSCGCoucXVvY2FuaGFydHNpdC1tYWxheS50a4IUKi50YXliYWN0cmF2ZWwtY3IudGuCFyoudGF5YmFjdHJhdmVsLW1hbGF5LnRrghhjaWFsaXNoaW50YWFwdGVla2lzc2EubnWCE2RpYWJldGljbWFsZXNlc3QuZ2GCFmRpc2NvdW50YXNwaGFsdHNlc3QuY2aCFmRpc2NvdW50YXNwaGFsdHNlc3QuZ2GCHGRpc2NvdW50YnJlYXN0c3VyZ2VyeXNlc3QuZ2GCGGRpc2NvdW50Y3JlYXRpb25zc2VzdC5jZoIYZGlzY291bnRjcmVhdGlvbnNzZXN0LmdhghFkb2dzd2VpZ2h0c2VzdC5jZoITZG9tYWlubmFtZW1kc2VzdC5jZoISZG9tYWluc3BlYXJzZXN0LmdhghBkb3RvZmZlcnNzZXN0LmNmghdkb3dubG9hZHdvcmtzaG9wc2VzdC5jZoIQZHJpdmVsb25nc2VzdC5nYYITZHVtbXljb3Vyc2Vzc2VzdC5jZoIVZWFybHljbGVhcmFuY2VzZXN0LmdhghJlYml6c3R1ZGVudHNlc3QuY2aCEWVnb2NoZWNrZXJzZXN0LmNmghhlbGVjdHJvbmljc3BhdHJvbHNlc3QuZ2GCEmVtb3Rpb25ibG9nc2VzdC5jZoIVZXRlcm5hbHZpdGFtaW5zZXN0LmNmghlldWdlbmV0cmF2ZWxhZ2VuY3lzZXN0LmNmghJldXJvY2xhc3Nlc3Nlc3QuZ2GCFWV4aGF1c3RjbGVhbmVyc2VzdC5jZoIVZXhoYXVzdGNsZWFuZXJzZXN0LmdhghRmYWN0b3JpbmdyYXRlc2VzdC5jZoILZ2FuLWluZm8uY2aCDGthbmJvYXJkLm5ldIIMa2FuYm9hcmQub3Jngg1raWRzbWVudGFsLmNmggxtaW5pZmx1eC5uZXSCFnF1b2NhbmhhcnRzaXQtbWFsYXkudGuCEnRheWJhY3RyYXZlbC1jci50a4IVdGF5YmFjdHJhdmVsLW1hbGF5LnRrMAoGCCqGSM49BAMCA0cAMEQCIB25v+hk4BJJcgoD5oxv4YcPKmSdeYPW6cWJzrVGAy2tAiBtbLLS1Xrsit3yV5e75Erdd887AaJuZ60es1c509K71A=='
    });

    nock('https://data-01.censys.io', authHeaders)
      .persist()
      .get('/snapshots/certificates/20200719/first_file.json.gz')
      .reply(200, zlib.gzipSync(firstFileContents))
      .get('/snapshots/certificates/20200719/second_file.json.gz')
      .reply(200, zlib.gzipSync(secondFileContents));
    jest.setTimeout(30000);
    await censysCertificates({
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
      .get('/api/v1/data/certificates_2018/')
      .reply(200, {
        results: {
          latest: {
            details_url:
              'https://censys.io/api/v1/data/certificates_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/certificates_2018/20200719')
      .reply(200, {
        files: {
          'failed_file.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/certificates/20200719/failed_file.json.gz'
          }
        }
      });

    nock('https://data-01.censys.io')
      .get('/snapshots/certificates/20200719/failed_file.json.gz')
      .reply(429, 'too many requests');

    nock('https://data-01.censys.io')
      .get('/snapshots/certificates/20200719/failed_file.json.gz')
      .reply(200, zlib.gzipSync(JSON.stringify({})));

    jest.setTimeout(30000);
    await censysCertificates({
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
      .get('/api/v1/data/certificates_2018/')
      .reply(200, {
        results: {
          latest: {
            details_url:
              'https://censys.io/api/v1/data/certificates_2018/20200719'
          }
        }
      });
    nock('https://censys.io', authHeaders)
      .get('/api/v1/data/certificates_2018/20200719')
      .reply(200, {
        files: {
          'failed_file_2.json.gz': {
            file_type: 'json',
            compressed_size: 2568162,
            compression_type: 'gzip',
            compressed_md5_fingerprint: '334183d35efade2336033b38c4c528a6',
            download_path:
              'https://data-01.censys.io/snapshots/certificates/20200719/failed_file_2.json.gz'
          }
        }
      });

    nock('https://data-01.censys.io')
      .persist()
      .get('/snapshots/certificates/20200719/failed_file_2.json.gz')
      .reply(429, 'too many requests');

    await expect(
      censysCertificates({
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
      censysCertificates({
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
      censysCertificates({
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
      censysCertificates({
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
      censysCertificates({
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
