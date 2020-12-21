import { connectToDatabase, Domain, Organization, Scan } from '../../models';
import { handler as shodan } from '../shodan';
jest.mock('../helpers/getIps');
jest.mock('../helpers/saveServicesToDb');

const RealDate = Date;

describe('shodan', () => {
  let organization;
  let scan;
  beforeEach(async () => {
    await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'shodan',
      arguments: {},
      frequency: 999
    }).save();
    await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain2',
      ip: '31.134.10.156',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain3',
      ip: '153.126.148.61',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain4',
      ip: '85.24.146.152',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain5',
      ip: '45.79.207.117',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain6',
      ip: '156.249.159.119',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain7',
      ip: '221.10.15.220',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain8',
      ip: '81.141.166.145',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain9',
      ip: '24.65.82.187',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain10',
      ip: '52.74.149.117',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain11',
      ip: '31.134.10.156',
      organization
    }).save();
    await Domain.create({
      name: 'first_file_testdomain12',
      ip: '1.1.1.1',
      organization
    }).save();
  });

  afterEach(async () => {
    global.Date = RealDate;
  });

  const checkDomains = async (organization) => {
    const domains = await Domain.find({
      where: { organization },
      relations: ['organization', 'services']
    });
    expect(
      domains
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({
          ...e,
          services: e.services.map((s) => ({
            ...s,
            id: null,
            updatedAt: null,
            createdAt: null
          })),
          organization: null,
          id: null,
          updatedAt: null,
          createdAt: null,
          syncedAt: null
        }))
    ).toMatchSnapshot();
    expect(domains.filter((e) => !e.organization).length).toEqual(0);
  };
  test('basic test', async () => {
    console.log(organization.id);
    await shodan({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'd0f51c16-a64a-4ed0-8373-d66485bfc678',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    await checkDomains(organization);
  });
});
