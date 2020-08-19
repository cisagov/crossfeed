import { handler as findomain } from '../findomain';
import { connectToDatabase, Organization, Domain } from '../../models';
import { readFileSync } from 'fs';

jest.mock('child_process', () => ({
  spawnSync: () => null
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  unlinkSync: () => null
}));

describe('findomain', () => {
  beforeAll(async () => {
    await connectToDatabase();
    (readFileSync as jest.Mock).mockImplementation(() =>
      [
        'filedrop.cisa.gov,104.84.119.215',
        'www.filedrop.cisa.gov,104.84.119.215'
      ].join('\n')
    );
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
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const domains = await Domain.find({
      organization
    });
    expect(domains.length).toEqual(2);
    expect(domains[0].name).toEqual('filedrop.cisa.gov');
    expect(domains[0].ip).toEqual('104.84.119.215');
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
    const domain = await Domain.create({
      organization,
      name: 'filedrop.cisa.gov'
    }).save();
    await findomain({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const domains = await Domain.find({
      organization
    });
    expect(domains.length).toEqual(2);
    expect(domains[0].id).toEqual(domain.id);
    expect(domains[0].name).toEqual('filedrop.cisa.gov');
    expect(domains[0].ip).toEqual('104.84.119.215');
    expect(domains[1].name).toEqual('www.filedrop.cisa.gov');
    expect(domains[1].ip).toEqual('104.84.119.215');
  });
});
