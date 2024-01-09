import { handler as cve } from '../cve';
import {
  Organization,
  Domain,
  connectToDatabase,
  Service,
  Vulnerability
} from '../../models';
import * as nock from 'nock';
import * as zlib from 'zlib';

const unzipSyncSpy = jest.spyOn(zlib, 'unzipSync');

jest.mock('child_process', () => ({
  spawnSync: () => null,
  execSync: (cmd, { input }) => {
    expect(input).toMatchSnapshot('execSync.input');
    return [
      '0 CVE-2019-10866 cpe:/a:10web:form_maker:1.0.0 9.8 CWE-89',
      '0 CVE-2019-11590 cpe:/a:10web:form_maker:1.0.0 8.8 CWE-352'
    ].join('\n');
  }
}));

jest.mock('fs', () => ({
  promises: {
    readdir: (str) => ['nvdcve-1.1-2019.json.gz'],
    readFile: (str) => ''
  }
}));

jest.setTimeout(30000);

const RealDate = Date;

describe('cve', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    unzipSyncSpy.mockImplementation((contents) =>
      Buffer.from(
        JSON.stringify({
          CVE_Items: [
            {
              cve: {
                CVE_data_meta: { ID: 'CVE-2019-10866' },
                description: {
                  description_data: [
                    {
                      lang: 'en',
                      value: 'Test description'
                    }
                  ]
                },
                references: {
                  reference_data: [
                    {
                      url: 'https://example.com',
                      name: 'https://example.com',
                      refsource: 'CONFIRM',
                      tags: ['Patch', 'Vendor Advisory']
                    }
                  ]
                }
              }
            }
          ]
        })
      )
    );
  });
  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
  });
  afterAll(async () => {
    unzipSyncSpy.mockRestore();
    await connection.close();
    nock.cleanAll();
  });
  test('simple test', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      censysMetadata: {
        manufacturer: '10web',
        product: 'form_maker',
        version: '1.0.0'
      }
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      where: {
        domain: domain,
        service: service
      }
    });
    expect(vulnerabilities.length).toEqual(2);
    for (const vulnerability of vulnerabilities) {
      expect(vulnerability).toMatchSnapshot(
        {
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          actions: expect.any(Array)
        },
        'vulnerability'
      );
    }
  });

  test('product with cpe with no version in it should create no vulns', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      wappalyzerResults: [
        {
          technology: {
            cpe: 'cpe:/a:10web:form_maker'
          },
          version: ''
        }
      ]
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      where: {
        domain: domain,
        service: service
      }
    });
    expect(vulnerabilities.length).toEqual(0);
  });

  test('product with cpe without version in it', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      wappalyzerResults: [
        {
          technology: {
            cpe: 'cpe:/a:10web:form_maker'
          },
          version: '1.0.0'
        }
      ]
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      where: {
        domain: domain,
        service: service
      }
    });
    expect(vulnerabilities.length).toEqual(2);
    expect(vulnerabilities.map((e) => e.cve).sort()).toEqual([
      'CVE-2019-10866',
      'CVE-2019-11590'
    ]);
  });

  test('product with cpe with version in it', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      wappalyzerResults: [
        {
          technology: {
            cpe: 'cpe:/a:10web:form_maker:1.0.0'
          },
          version: '1.0.0'
        }
      ]
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      where: {
        domain: domain,
        service: service
      }
    });
    expect(vulnerabilities.length).toEqual(2);
    expect(vulnerabilities.map((e) => e.cve).sort()).toEqual([
      'CVE-2019-10866',
      'CVE-2019-11590'
    ]);
  });

  test('product with exchange cpe with version in it', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      wappalyzerResults: [
        {
          technology: {
            name: 'Microsoft Exchange Server',
            categories: [30],
            slug: 'microsoft-exchange-server',
            icon: 'Microsoft.png',
            website:
              'https://www.microsoft.com/en-us/microsoft-365/exchange/email',
            cpe: 'cpe:/a:microsoft:exchange_server'
          },
          version: '15.2.595'
        }
      ]
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });

  test('product with cpe with trailing colon', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const service = await Service.create({
      domain,
      port: 80,
      wappalyzerResults: [
        {
          technology: {
            cpe: 'cpe:/a:10web:form_maker::'
          },
          version: '1.0.0'
        }
      ]
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      where: {
        domain: domain,
        service: service
      }
    });
    expect(vulnerabilities.length).toEqual(2);
    expect(vulnerabilities.map((e) => e.cve).sort()).toEqual([
      'CVE-2019-10866',
      'CVE-2019-11590'
    ]);
  });

  const technologies = [
    {
      technology: {
        cpe: 'cpe:/a:microsoft:internet_information_server'
      },
      version: '7.5'
    },
    {
      technology: {
        cpe: 'cpe:/a:microsoft:internet_information_server:8.5'
      },
      version: '8.5'
    },
    {
      technology: {
        cpe: 'cpe:/a:microsoft:iis:2.5'
      },
      version: '2.5'
    }
  ];
  for (const technology of technologies) {
    test(`product with IIS cpe ${technology.technology.cpe} should include alternate cpes defined in productMap`, async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      const service = await Service.create({
        domain,
        port: 80,
        wappalyzerResults: [technology]
      }).save();

      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });
    });
  }

  test('should exit if no matching domains with cpes', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      domain
    });
    expect(vulnerabilities.length).toEqual(0);
  });
  test('closes old vulnerabilities', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      lastSeen: new Date(
        new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 10)
      ),
      title: '123',
      description: '123'
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.state).toEqual('closed');
    expect(vuln?.substate).toEqual('remediated');
  });
  test('does not close new vulnerability', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      lastSeen: new Date(Date.now()),
      title: '123',
      description: '123'
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.state).toEqual('open');
    expect(vuln?.substate).toEqual('unconfirmed');
  });
  test('reopens remediated vulnerability found again', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      lastSeen: new Date(Date.now()),
      title: '123',
      description: '123',
      state: 'closed',
      substate: 'remediated'
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.state).toEqual('open');
    expect(vuln?.substate).toEqual('unconfirmed');
  });
  test('does not reopen false positive vulnerability found again', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      lastSeen: new Date(Date.now()),
      title: '123',
      description: '123',
      state: 'closed',
      substate: 'false-positive'
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.state).toEqual('closed');
    expect(vuln?.substate).toEqual('false-positive');
  });
  test('populates vulnerability', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      cve: 'CVE-2019-10866',
      lastSeen: new Date(Date.now()),
      title: '123',
      needsPopulation: true
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.description).toEqual('Test description');
    expect(vuln?.references).toEqual([
      {
        url: 'https://example.com',
        name: 'https://example.com',
        source: 'CONFIRM',
        tags: ['Patch', 'Vendor Advisory']
      }
    ]);
  });
  test('does not populate non-needsPopulation vulnerability', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const vulnerability = await Vulnerability.create({
      domain,
      lastSeen: new Date(Date.now()),
      title: '123',
      needsPopulation: false
    }).save();
    await cve({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vuln = await Vulnerability.findOne({
      id: vulnerability.id
    });
    expect(vuln?.description).toBeFalsy();
    expect(vuln?.references).toEqual([]);
  });
  describe('certs', () => {
    test('invalid certs', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization,
        ssl: {
          valid: false
        }
      }).save();
      const domain2 = await Domain.create({
        name: name + '-2',
        organization,
        ssl: {
          valid: true
        }
      }).save();
      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });

      const vulns = await Vulnerability.find({
        domain: { id: domain.id }
      });
      expect(vulns.length).toEqual(1);
      expect(
        vulns.map((e) => ({
          ...e,
          createdAt: !!e.createdAt,
          updatedAt: !!e.updatedAt,
          lastSeen: !!e.lastSeen,
          id: !!e.id
        }))
      ).toMatchSnapshot();

      const vulns2 = await Vulnerability.find({
        domain: { id: domain2.id }
      });
      expect(vulns2.length).toEqual(0);
    });
    test('expiring certs', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization,
        ssl: {
          validTo: new Date(Date.now()).toISOString()
        }
      }).save();
      const domain2 = await Domain.create({
        name: name + '-2',
        organization,
        ssl: {
          validTo: '9999-08-23T03:36:57.231Z'
        }
      }).save();
      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });

      const vulns = await Vulnerability.find({
        domain: { id: domain.id }
      });
      expect(vulns.length).toEqual(1);
      expect(
        vulns.map((e) => ({
          ...e,
          createdAt: !!e.createdAt,
          updatedAt: !!e.updatedAt,
          lastSeen: !!e.lastSeen,
          id: !!e.id
        }))
      ).toMatchSnapshot();

      const vulns2 = await Vulnerability.find({
        domain: { id: domain2.id }
      });
      expect(vulns2.length).toEqual(0);
    });
  });
  describe('kev', () => {
    const kevResponse = {
      title: 'CISA Catalog of Known Exploited Vulnerabilities',
      catalogVersion: '2022.04.25',
      dateReleased: '2022-04-25T15:51:14.1414Z',
      count: 2,
      vulnerabilities: [
        {
          cveID: 'CVE-2021-27104',
          vendorProject: 'Accellion',
          product: 'FTA',
          vulnerabilityName: 'Accellion FTA OS Command Injection Vulnerability',
          dateAdded: '2021-11-03',
          shortDescription:
            'Accellion FTA 9_12_370 and earlier is affected by OS command execution via a crafted POST request to various admin endpoints.',
          requiredAction: 'Apply updates per vendor instructions.',
          dueDate: '2021-11-17'
        },
        {
          cveID: 'CVE-2021-27102',
          vendorProject: 'Accellion',
          product: 'FTA',
          vulnerabilityName: 'Accellion FTA OS Command Injection Vulnerability',
          dateAdded: '2021-11-03',
          shortDescription:
            'Accellion FTA 9_12_411 and earlier is affected by OS command execution via a local web service call.',
          requiredAction: 'Apply updates per vendor instructions.',
          dueDate: '2021-11-17'
        }
      ]
    };
    test('should add kev detail', async () => {
      nock('https://www.cisa.gov')
        .get('/sites/default/files/feeds/known_exploited_vulnerabilities.json')
        .reply(200, kevResponse);

      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      let vulnerability = await Vulnerability.create({
        domain,
        cve: 'CVE-2021-27104',
        lastSeen: new Date(
          new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 10)
        ),
        title: 'CVE-2021-27104',
        description: '123'
      }).save();
      let vulnerability2 = await Vulnerability.create({
        domain,
        cve: 'CVE-2021-27102',
        lastSeen: new Date(
          new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 10)
        ),
        title: 'CVE-2021-27102',
        description: '123'
      }).save();

      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });

      vulnerability = (await Vulnerability.findOne({
        id: vulnerability.id
      })) as Vulnerability;
      vulnerability2 = (await Vulnerability.findOne({
        id: vulnerability2.id
      })) as Vulnerability;

      expect(vulnerability.isKev).toEqual(true);
      expect(vulnerability2.isKev).toEqual(true);

      expect(vulnerability.kevResults).toEqual(kevResponse.vulnerabilities[0]);
      expect(vulnerability2.kevResults).toEqual(kevResponse.vulnerabilities[1]);
    });
    test('should not add kev detail to non-kev', async () => {
      nock('https://www.cisa.gov')
        .get('/sites/default/files/feeds/known_exploited_vulnerabilities.json')
        .reply(200, kevResponse);

      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      let vulnerability = await Vulnerability.create({
        domain,
        cve: 'CVE-2021-XXXXX',
        lastSeen: new Date(
          new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 10)
        ),
        title: 'CVE-2021-XXXXX',
        description: '123'
      }).save();

      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });

      vulnerability = (await Vulnerability.findOne({
        id: vulnerability.id
      })) as Vulnerability;

      expect(vulnerability.isKev).toEqual(false);

      expect(vulnerability.kevResults).toEqual({});
    });
    test('should not update existing kev', async () => {
      nock('https://www.cisa.gov')
        .get('/sites/default/files/feeds/known_exploited_vulnerabilities.json')
        .reply(200, kevResponse);

      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      let vulnerability = await Vulnerability.create({
        domain,
        cve: 'CVE-2021-27104',
        lastSeen: new Date(
          new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 10)
        ),
        title: 'CVE-2021-27104',
        description: '123',
        isKev: true,
        kevResults: {}
      }).save();

      await cve({
        organizationId: organization.id,
        scanId: 'scanId',
        scanName: 'scanName',
        scanTaskId: 'scanTaskId'
      });

      vulnerability = (await Vulnerability.findOne({
        id: vulnerability.id
      })) as Vulnerability;

      expect(vulnerability.isKev).toEqual(true);

      expect(vulnerability.kevResults).toEqual({});
    });
  });
  // describe('identify unexpected webpages', () => {
  //   test('basic test', async () => {
  //     const organization = await Organization.create({
  //       name: 'test-' + Math.random(),
  //       rootDomains: ['test-' + Math.random()],
  //       ipBlocks: [],
  //       isPassive: false
  //     }).save();
  //     const name = 'test-' + Math.random();
  //     const domain = await Domain.create({
  //       name,
  //       organization
  //     }).save();
  //     await Webpage.create({
  //       domain,
  //       url: 'http://url-ok',
  //       status: 200
  //     }).save();
  //     await Webpage.create({
  //       domain,
  //       url: 'http://url-not-ok',
  //       status: 500
  //     }).save();
  //     await Webpage.create({
  //       domain,
  //       url: 'http://url-not-ok-2',
  //       status: 503
  //     }).save();
  //     await cve({
  //       organizationId: organization.id,
  //       scanId: 'scanId',
  //       scanName: 'scanName',
  //       scanTaskId: 'scanTaskId'
  //     });

  //     const vulns = await Vulnerability.find({
  //       domain: { id: domain.id }
  //     });
  //     expect(
  //       vulns.map((e) => ({
  //         ...e,
  //         createdAt: !!e.createdAt,
  //         updatedAt: !!e.updatedAt,
  //         lastSeen: !!e.lastSeen,
  //         id: !!e.id
  //       }))
  //     ).toMatchSnapshot();
  //   });
  // });
});
