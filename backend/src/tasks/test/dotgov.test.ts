import { handler as dotgov, DOTGOV_TAG_NAME } from '../dotgov';
import * as nock from 'nock';
import { connectToDatabase, Scan, Organization, OrganizationTag } from '../../models';


describe('dotgov', () => {
  let scan;
  beforeEach(async () => {
    await connectToDatabase();
    scan = await Scan.create({
      name: 'censysIpv4',
      arguments: {},
      frequency: 999
    }).save();
  });

  test('basic test', async () => {
    nock('https://github.com')
      .get('/cisagov/dotgov-data/blob/main/current-federal.csv')
      .reply(200, `Domain Name,Domain Type,Agency,Organization,City,State,Security Contact Email
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

    await OrganizationTag.delete({name: DOTGOV_TAG_NAME});
    await dotgov({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });

    const tag = await OrganizationTag.findOne({where: {name: DOTGOV_TAG_NAME}});
    expect(tag).toBeTruthy();

    const organizations = await Organization.find({
        where: {
            tags: {
                name: tag
            }
        },
        relations: ['tags']
    })
    expect(organizations).toEqual([]);

    // await checkDomains(organization);
  });
});
