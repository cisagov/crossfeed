import { handler as rootDomainSync } from '../rootDomainSync';
import { connectToDatabase, Organization, Domain, Scan } from '../../models';

jest.mock('dns', () => ({
  promises: {
    lookup: async (domainName) => ({ address: '104.84.119.215' })
  }
}));

describe('rootDomainSync', () => {
  let scan;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    scan = await Scan.create({
      name: 'rootDomainSync',
      arguments: {},
      frequency: 999
    }).save();
  });
  afterAll(async () => {
    await connection.close();
  });

  test('should add new domains', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['rootdomain.example1'],
      ipBlocks: [],
      isPassive: false
    }).save();
    await rootDomainSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const domains = await Domain.find({
      where: { organization },
      relations: ['organization']
    });
    expect(domains.length).toEqual(1);
    expect(domains[0].name).toEqual('rootdomain.example1');
    expect(domains[0].ip).toEqual('104.84.119.215');
    expect(domains[0].organization.id).toEqual(organization.id);
  });
});
