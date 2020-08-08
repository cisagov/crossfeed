import { handler as cve } from '../cve';
import { Organization, Domain, connectToDatabase, Service, Vulnerability } from '../../models';

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
  test('end-to-end test', async () => {
    jest.setTimeout(200000);
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
    for (let vulnerability of vulnerabilities) {
      expect(vulnerability).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(Date)
      });
    }
  });
});
