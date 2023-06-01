import getAllDomains from '../../helpers/getAllDomains';
import { Domain, connectToDatabase, Organization } from '../../../models';

describe('getAllDomains', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  test('basic test', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = Math.random() + '';
    const ip = Math.random() + '';
    const domain = await Domain.create({
      name,
      ip,
      organization
    }).save();
    const domains = await getAllDomains();
    expect(domains.length).toBeGreaterThan(0);
    const domainIndex = domains.map((e) => e.id).indexOf(domain.id);
    expect(domains[domainIndex]).toEqual({
      id: domain.id,
      name,
      ip,
      organization: organization
    });
  });
  test('providing organizations filters based on that organization', async () => {
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const organization2 = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const organization3 = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const name = Math.random() + '';
    const ip = Math.random() + '';
    const domain = await Domain.create({
      name,
      ip,
      organization: organization
    }).save();
    const name2 = Math.random() + '';
    const ip2 = Math.random() + '';
    const domain2 = await Domain.create({
      name: name2,
      ip: ip2,
      organization: organization2
    }).save();
    const name3 = Math.random() + '';
    const ip3 = Math.random() + '';
    const domain3 = await Domain.create({
      name: name3,
      ip: ip3,
      organization: organization3
    }).save();
    const domains = await getAllDomains([organization.id, organization2.id]);
    expect(domains.length).toEqual(2);
    const domain1Index = domains.map((e) => e.id).indexOf(domain.id);
    expect(domains[domain1Index]).toEqual({
      id: domain.id,
      name,
      ip,
      organization: organization
    });
    const domain2Index = domains.map((e) => e.id).indexOf(domain2.id);
    expect(domains[domain2Index]).toEqual({
      id: domain2.id,
      name: name2,
      ip: ip2,
      organization: organization2
    });
  });
});
