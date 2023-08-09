import {
  handler as dotgov,
  DOTGOV_TAG_NAME,
  DOTGOV_ORG_SUFFIX,
  DOTGOV_LIST_ENDPOINT
} from '../dotgov';
import * as nock from 'nock';
import {
  connectToDatabase,
  Scan,
  Organization,
  OrganizationTag
} from '../../models';

const HOST = 'https://raw.githubusercontent.com';
const PATH = DOTGOV_LIST_ENDPOINT.replace(HOST, '');

describe('dotgov', () => {
  let scan;
  let connection;
  beforeEach(async () => {
    connection = await connectToDatabase();
    scan = await Scan.create({
      name: 'dotgov',
      arguments: {},
      frequency: 999
    }).save();
    // Clean up any OrganizationTag / Organizations created from earlier tests
    await OrganizationTag.delete({ name: DOTGOV_TAG_NAME });
    await Organization.createQueryBuilder('organization')
      .where('name like :name', { name: `%${DOTGOV_ORG_SUFFIX}%` })
      .delete()
      .execute();
  });
  afterEach(async () => {
    await connection.close();
  });
  afterAll(async () => {
    nock.cleanAll();
  });
  test('basic test', async () => {
    nock(HOST)
      .get(PATH)
      .reply(
        200,
        `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
ACUS.GOV,Federal Agency - Executive,Administrative Conference of the United States,ADMINISTRATIVE CONFERENCE OF THE UNITED STATES,Washington,DC,info@acus.gov
ACHP.GOV,Federal Agency - Executive,Advisory Council on Historic Preservation,ACHP,Washington,DC,domainsecurity@achp.gov
PRESERVEAMERICA.GOV,Federal Agency - Executive,Advisory Council on Historic Preservation,ACHP,Washington,DC,domainsecurity@achp.gov
ABMC.GOV,Federal Agency - Executive,American Battle Monuments Commission,American Battle Monuments Commission,Arlington,VA,itsec@abmc.gov
ABMCSCHOLAR.GOV,Federal Agency - Executive,American Battle Monuments Commission,Office of Chief Information Officer,Arlington,VA,itsec@abmc.gov
NATIONALMALL.GOV,Federal Agency - Executive,American Battle Monuments Commission,Office of Chief Information Officer,Arlington,VA,itsec@abmc.gov
AMTRAKOIG.GOV,Federal Agency - Executive,AMTRAK,Amtrak Office of Inspector General,Washington,DC,(blank)
ARC.GOV,Federal Agency - Executive,Appalachian Regional Commission,ARC,Washington,DC,(blank)
ASC.GOV,Federal Agency - Executive,Appraisal Subcommittee,Appraisal Subcommittee,Washington,DC,(blank)
AFRH.GOV,Federal Agency - Executive,Armed Forces Retirement Home,Armed Forces Retirement Home,Washington,DC,Stanley.Whitehead@afrh.gov
GOLDWATERSCHOLARSHIP.GOV,Federal Agency - Executive,Barry Goldwater Scholarship and Excellence in Education Foundation,Barry Goldwater Scholarship and Excellence in Education Foundation,Alexandria,VA,goldwaterao@goldwaterscholarship.gov`
      );

    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const tag = await OrganizationTag.findOne({
      where: { name: DOTGOV_TAG_NAME }
    });
    expect(tag).toBeTruthy();

    const organizations = await Organization.createQueryBuilder('organization')
      .innerJoinAndSelect('organization.tags', 'tags')
      .where('tags.id = :tagId', { tagId: tag!.id })
      .getMany();
    expect(
      organizations.map((o) => ({
        name: o.name,
        rootDomains: o.rootDomains
      }))
    ).toMatchSnapshot();
  });

  test('combines root domains together', async () => {
    nock(HOST)
      .get(PATH)
      .reply(
        200,
        `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
site1.gov,Federal Agency - Executive,Agency 1,Agency 1,Washington,DC,info@acus.gov
site2.gov,Federal Agency - Executive,Agency 1,Agency 1,Washington,DC,domainsecurity@achp.gov`
      );

    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const tag = await OrganizationTag.findOne({
      where: { name: DOTGOV_TAG_NAME }
    });
    expect(tag).toBeTruthy();

    const organizations = await Organization.createQueryBuilder('organization')
      .innerJoinAndSelect('organization.tags', 'tags')
      .where('tags.id = :tagId', { tagId: tag!.id })
      .getMany();

    expect(organizations.length).toEqual(1);
    expect(organizations[0].name).toEqual('Agency 1 (dotgov)');
    expect(organizations[0].rootDomains).toEqual(['site1.gov', 'site2.gov']);
  });

  test("doesn't touch existing organizations with the same name but not with the dotgov-tag", async () => {
    nock(HOST)
      .get(PATH)
      .reply(
        200,
        `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
site1.gov,Federal Agency - Executive,Agency 1,Agency 1,Washington,DC,info@acus.gov`
      );

    const originalOrganization = await Organization.create({
      name: 'Agency 1',
      ipBlocks: [],
      isPassive: true,
      rootDomains: ['a', 'b', 'c']
    }).save();
    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const tag = await OrganizationTag.findOne({
      where: { name: DOTGOV_TAG_NAME }
    });
    expect(tag).toBeTruthy();

    const organizations = await Organization.createQueryBuilder('organization')
      .innerJoinAndSelect('organization.tags', 'tags')
      .where('tags.id = :tagId', { tagId: tag!.id })
      .getMany();

    expect(organizations.length).toEqual(1);
    expect(organizations[0].name).toEqual('Agency 1 (dotgov)');
    expect(organizations[0].rootDomains).toEqual(['site1.gov']);
    expect(organizations[0].id).not.toEqual(originalOrganization.id);
  });

  test('should use existing tag with DOTGOV_TAG_NAME if it exists', async () => {
    nock(HOST)
      .get(PATH)
      .reply(
        200,
        `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
site1.gov,Federal Agency - Executive,Agency 1,Agency 1,Washington,DC,info@acus.gov`
      );

    const originalTag = await OrganizationTag.create({
      name: DOTGOV_TAG_NAME
    }).save();
    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const tags = await OrganizationTag.find({
      where: { name: DOTGOV_TAG_NAME }
    });
    expect(tags.length).toEqual(1);
    const tag = tags[0];
    expect(tag!.id).toEqual(originalTag.id);

    const organizations = await Organization.createQueryBuilder('organization')
      .innerJoinAndSelect('organization.tags', 'tags')
      .where('tags.id = :tagId', { tagId: tag!.id })
      .getMany();

    expect(organizations.length).toEqual(1);
    expect(organizations[0].name).toEqual('Agency 1 (dotgov)');
    expect(organizations[0].rootDomains).toEqual(['site1.gov']);
  });

  test('updates existing organizations with the same name and with the dotgov-tag -- should replace all rootDomains', async () => {
    nock(HOST)
      .get(PATH)
      .reply(
        200,
        `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
site1.gov,Federal Agency - Executive,Agency 1,Agency 1,Washington,DC,info@acus.gov`
      );

    const tag = await OrganizationTag.create({
      name: DOTGOV_TAG_NAME
    }).save();

    const originalOrganization = await Organization.create({
      name: 'Agency 1 (dotgov)',
      ipBlocks: [],
      tags: [tag],
      isPassive: false,
      rootDomains: ['a', 'b', 'c']
    }).save();
    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const organizations = await Organization.createQueryBuilder('organization')
      .innerJoinAndSelect('organization.tags', 'tags')
      .where('tags.id = :tagId', { tagId: tag!.id })
      .getMany();

    expect(organizations.length).toEqual(1);
    expect(organizations[0].name).toEqual('Agency 1 (dotgov)');
    expect(organizations[0].rootDomains).toEqual(['site1.gov']);
    expect(organizations[0].id).toEqual(originalOrganization.id);
    expect(organizations[0].isPassive).toEqual(false);
  });
});
