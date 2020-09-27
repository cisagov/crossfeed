import { handler as searchSync } from '../search-sync';
import {
  connectToDatabase,
  Organization,
  Domain,
  Scan,
  Service,
  Vulnerability,
  Webpage
} from '../../models';

jest.mock('../es-client');
jest.mock('../s3-client');
const { updateDomains, updateWebpages } = require('../es-client');
const { getWebpageBody } = require('../s3-client');

describe('search_sync', () => {
  let organization;
  beforeAll(async () => {
    await connectToDatabase();
  });
  beforeEach(async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  test('no domains', async () => {
    await searchSync({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateDomains).not.toBeCalled();
    expect(updateWebpages).not.toBeCalled();
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
      syncedAt: new Date('2020-10-10')
    }).save();

    await Service.create({
      service: 'https',
      port: 443,
      domain,
      updatedAt: new Date('2020-10-11')
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

  test('should update a domain if a domain has changed', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization,
      syncedAt: new Date('2020-09-19T19:57:32.346Z'),
      updatedAt: new Date('2020-09-20T19:57:32.346Z')
    }).save();

    const service = await Service.create({
      service: 'https',
      port: 443,
      domain,
      updatedAt: new Date('2020-09-12T19:57:32.346Z')
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

  test('should not sync webpages when webpages have already been synced', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization
    }).save();

    const webpage = await Webpage.create({
      domain,
      url: 'https://cisa.gov/123',
      status: 200,
      updatedAt: new Date('2020-08-23T03:36:57.231Z'),
      syncedAt: new Date('2020-08-30T03:36:57.231Z')
    }).save();

    await searchSync({
      domainId: domain.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateWebpages).not.toBeCalled();
  });

  test('should sync webpages when webpages have never been synced', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization
    }).save();

    let webpage = await Webpage.create({
      domain,
      url: 'https://cisa.gov/123',
      status: 200,
      updatedAt: new Date('2020-08-23T03:36:57.231Z'),
      s3Key: "testS3key",
    }).save();

    await searchSync({
      domainId: domain.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateWebpages).toBeCalled();
    expect(
      Object.keys((updateWebpages as jest.Mock).mock.calls[0][0][0])
    ).toMatchSnapshot();
    
    expect(getWebpageBody).toHaveBeenCalled();
    expect(
      (getWebpageBody as jest.Mock).mock.calls[0]
    ).toMatchSnapshot();

    webpage = (await Webpage.findOne(webpage.id)) as Webpage;
    expect(webpage.syncedAt).toBeTruthy();
  });

  test('should sync webpages when webpages have been updated since being synced', async () => {
    const domain = await Domain.create({
      name: 'cisa.gov',
      organization
    }).save();

    const webpage = await Webpage.create({
      domain,
      url: 'https://cisa.gov/123',
      status: 200,
      updatedAt: new Date('2020-08-30T03:36:57.231Z'),
      syncedAt: new Date('2020-08-23T03:36:57.231Z')
    }).save();

    await searchSync({
      domainId: domain.id,
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    expect(updateWebpages).toBeCalled();
  });
});
