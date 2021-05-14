import { handler as rootDomainSync } from '../rootDomainSync';
import { connectToDatabase, Organization, Domain, Scan } from '../../models';

describe('rootDomainSync', () => {
  let scan;
  beforeAll(async () => {
    await connectToDatabase();
    scan = await Scan.create({
      name: 'rootDomainSync',
      arguments: {},
      frequency: 999
    }).save();
  });

  test('should add new domains', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['rootdomain.example1', 'rootdomain.example2'],
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
    expect(domains.length).toEqual(2);
    expect(domains[0].name).toEqual('rootdomain.example1');
    expect(domains[0].ip).toEqual(null);
    expect(domains[0].organization.id).toEqual(organization.id);
    expect(domains[1].name).toEqual('rootdomain.example2');
    expect(domains[1].ip).toEqual(null);
  });
});
