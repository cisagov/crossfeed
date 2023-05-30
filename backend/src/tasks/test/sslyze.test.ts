import { handler as sslyze } from '../sslyze';
import { connectToDatabase, Organization, Service, Domain } from '../../models';

jest.mock('ssl-checker', () => () => ({
  daysRemaining: 125,
  valid: true,
  validFrom: '2020-06-15T00:00:00.000Z',
  validTo: '2021-03-07T12:00:00.000Z',
  validFor: [
    'www3.dhs.gov',
    'biometrics.gov',
    'us-cert.cisa.gov',
    'preview.cisa.gov',
    'fema.com',
    'www.cisa.gov'
  ]
}));

describe('sslyze', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
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
  afterAll(async () => {
    await connection.close();
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
        "altNames": Array [
          "www3.dhs.gov",
          "biometrics.gov",
          "us-cert.cisa.gov",
          "preview.cisa.gov",
          "fema.com",
          "www.cisa.gov",
        ],
        "valid": true,
        "validFrom": "2020-06-15T00:00:00.000Z",
        "validTo": "2021-03-07T12:00:00.000Z",
      }
    `);
  });
  test('should not be called on non-https domains', async () => {
    let domain = await Domain.create({
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
    domain = (await Domain.findOne(domain.id)) as Domain;
    expect(domain.ssl).toEqual(null);
  });
});
