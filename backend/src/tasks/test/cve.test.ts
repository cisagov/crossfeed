import { handler as cve } from '../cve';
import {
  Organization,
  Domain,
  connectToDatabase,
  Service,
  Vulnerability,
  Webpage
} from '../../models';

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

jest.mock('zlib', () => ({
  unzipSync: (contents) =>
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
}));

const RealDate = Date;

describe('cve', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
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
        new Date(Date.now()).setDate(new Date(Date.now()).getDate() - 7)
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
  describe('identify invalid certs', () => {
    test('basic test', async () => {
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
