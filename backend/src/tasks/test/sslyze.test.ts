import { handler as sslyze } from '../sslyze';
import { connectToDatabase, Organization, Service, Domain } from '../../models';

jest.mock('child_process', () => ({
  execSync: function (a, b) {
    expect([a, b]).toMatchSnapshot();
    return `depth=2 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root CA
  verify return:1
  depth=1 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Secure Site ECC CA-1
  verify return:1
  depth=0 C = US, ST = District Of Columbia, L = Washington, O = Department of Homeland Security, CN = www3.dhs.gov
  verify return:1
  DONE
  notAfter=Mar  7 12:00:00 2021 GMT`;
  }
}));

describe('sslyze', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  let organization;
  beforeEach(async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  test('basic test', async () => {
    let domain = await Domain.create({
      organization,
      name: 'www.cisa.gov',
      ip: '0.0.0.0'
    }).save();
    const service = await Service.create({
      service: 'https',
      port: 443,
      domain
    }).save();
    await sslyze({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
    domain = (await Domain.findOne(domain.id)) as Domain;
    expect(domain.ssl).toMatchInlineSnapshot(`
      Object {
        "validTo": "2021-03-07T12:00:00.000Z",
      }
    `);
  });
  test('should not be called on non-https domains', async () => {
    const domain = await Domain.create({
      organization,
      name: 'www.cisa.gov',
      ip: '0.0.0.0'
    }).save();
    const service = await Service.create({
      service: 'http',
      port: 80,
      domain
    }).save();
    await sslyze({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
  });
});
