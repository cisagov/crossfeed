import { handler as findomain } from '../findomain';
import { connectToDatabase, Organization, Domain, Scan } from '../../models';
import { readFileSync } from 'fs';

jest.mock('child_process', () => ({
  spawnSync: () => null
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  unlinkSync: () => null
}));

describe('findomain', () => {
  let scan;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    (readFileSync as jest.Mock).mockImplementation(() =>
      [
        'filedrop.cisa.gov,104.84.119.215',
        'www.filedrop.cisa.gov,104.84.119.215'
      ].join('\n')
    );
    scan = await Scan.create({
      name: 'findomain',
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
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    await findomain({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const domains = (
      await Domain.find({
        where: { organization },
        relations: ['organization', 'discoveredBy']
      })
    ).sort((a, b) => a.name.localeCompare(b.name));
    expect(domains.length).toEqual(2);
    expect(domains[0].name).toEqual('filedrop.cisa.gov');
    expect(domains[0].ip).toEqual('104.84.119.215');
    expect(domains[0].organization.id).toEqual(organization.id);
    expect(domains[0].discoveredBy.id).toEqual(scan.id);
    expect(domains[1].name).toEqual('www.filedrop.cisa.gov');
    expect(domains[1].ip).toEqual('104.84.119.215');
  });
  test('should update existing domains', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const scanOld = await Scan.create({
      name: 'findomain',
      arguments: {},
      frequency: 999
    }).save();
    const domain = await Domain.create({
      organization,
      name: 'filedrop.cisa.gov',
      discoveredBy: scanOld,
      fromRootDomain: 'oldrootdomain.cisa.gov'
    }).save();
    await findomain({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const domains = (
      await Domain.find({
        where: { organization },
        relations: ['discoveredBy']
      })
    ).sort((a, b) => a.name.localeCompare(b.name));
    expect(domains.length).toEqual(2);
    expect(domains[0].id).toEqual(domain.id);
    expect(domains[0].name).toEqual('filedrop.cisa.gov');
    expect(domains[0].ip).toEqual('104.84.119.215');
    expect(domains[0].discoveredBy.id).toEqual(scanOld.id);
    expect(domains[0].fromRootDomain).toEqual('oldrootdomain.cisa.gov');
    expect(domains[1].name).toEqual('www.filedrop.cisa.gov');
    expect(domains[1].ip).toEqual('104.84.119.215');
    expect(domains[1].discoveredBy.id).toEqual(scan.id);
    expect(domains[1].fromRootDomain).toEqual(organization.rootDomains[0]);
  });
});
