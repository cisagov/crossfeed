import { handler as cve } from '../cve';
import {
  Organization,
  Domain,
  connectToDatabase,
  Service,
  Vulnerability
} from '../../models';

jest.mock('child_process', () => ({
  spawnSync: (cmd, { input }) => {
    if (cmd.indexOf('cpe2cve') > -1) {
      expect(input).toMatchSnapshot('spawnSync.input');
      return {
        status: 0,
        stdout: Buffer.from(
          [
            '0 CVE-2019-10866 cpe:/a:10web:form_maker:1.0.0 9.8 CWE-89',
            '0 CVE-2019-11590 cpe:/a:10web:form_maker:1.0.0 8.8 CWE-352'
          ].join('\n')
        ),
        stderr: Buffer.from('')
      };
    }
  }
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
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const vulnerabilities = await Vulnerability.find({
      domain
    });
    expect(vulnerabilities.length).toEqual(2);
    for (const vulnerability of vulnerabilities) {
      expect(vulnerability).toMatchSnapshot(
        {
          id: expect.any(String),
          createdAt: expect.any(Date)
        },
        'vulnerability'
      );
    }
  });
});
