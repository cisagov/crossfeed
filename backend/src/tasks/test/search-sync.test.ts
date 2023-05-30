import { handler as searchSync, DOMAIN_CHUNK_SIZE } from '../search-sync';
import {
  connectToDatabase,
  Organization,
  Domain,
  Service,
  Vulnerability
} from '../../models';

jest.mock('../es-client');
const { updateDomains, updateWebpages } = require('../es-client');

describe('search_sync', () => {
  let organization;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  beforeEach(async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });

  test('should not update already-synced domains', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await Service.create({
      service: 'https',
      port: 443,
      domain
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).not.toBeCalled();
  });

  test('should update a domain if a service has changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await Service.create({
      service: 'https',
      port: 443,
      domain,
      updatedAt: new Date('9999-10-11')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).toBeCalled();
  });

  test('should not update a domain if a service has not changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await Service.create({
      service: 'https',
      port: 443,
      domain,
      updatedAt: new Date('9999-9-11')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).not.toBeCalled();
  });

  test('should update a domain if a vulnerability has changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await Vulnerability.create({
      domain,
      title: 'vuln',
      updatedAt: new Date('9999-10-11')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).toBeCalled();
  });

  test('should not update a domain if a vulnerability has not changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await Vulnerability.create({
      domain,
      title: 'vuln',
      updatedAt: new Date('9999-9-11')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).not.toBeCalled();
  });

  test('should update a domain if an organization has changed', async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false,
      updatedAt: new Date('9999-10-11')
    }).save();

    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).toBeCalled();
  });

  test('should not update a domain if an organization has not changed', async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false,
      updatedAt: new Date('9999-9-11')
    }).save();

    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-10-10')
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).not.toBeCalled();
  });

  test('should update a domain if a domain has changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('9999-09-19T19:57:32.346Z'),
      updatedAt: new Date('9999-09-20T19:57:32.346Z')
    }).save();

    const service = await Service.create({
      service: 'https',
      port: 443,
      domain,
      updatedAt: new Date('9999-09-12T19:57:32.346Z')
    }).save();

    const vulnerability = await Vulnerability.create({
      title: 'test-' + Math.random(),
      domain
    }).save();

    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).toBeCalled();
    expect(
      Object.keys((updateDomains as jest.Mock).mock.calls[0][0][0])
    ).toMatchSnapshot();

    const domains = updateDomains.mock.calls[0][0];
    expect(domains.length).toEqual(1);
    expect(domains[0].id).toEqual(domain.id);
    expect(domains[0].organization.id).toEqual(organization.id);
    expect(domains[0].services.map((e) => e.id)).toEqual([service.id]);
    expect(domains[0].vulnerabilities.map((e) => e.id)).toEqual([
      vulnerability.id
    ]);

    const newDomain = await Domain.findOneOrFail(domain.id);
    expect(newDomain.syncedAt).not.toEqual(domain.syncedAt);
  });

  test('should sync domains in chunks', async () => {
    await Promise.all(
      new Array(DOMAIN_CHUNK_SIZE + 1).fill(null).map((e) =>
        Domain.create({
          name: 'cisa-' + Math.random() + '.gov',
          organization,
          syncedAt: new Date('9999-09-19T19:57:32.346Z'),
          updatedAt: new Date('9999-09-20T19:57:32.346Z')
        }).save()
      )
    );

    await searchSync({
      organizationId: organization.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).toBeCalledTimes(2);
  });
});
