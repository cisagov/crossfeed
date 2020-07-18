import { handler as censysIpv4 } from "../censysIpv4";

jest.mock('../helpers/getCensysIpv4Data');
jest.mock('../helpers/saveDomainsToDb');
jest.mock('../helpers/saveServicesToDb');
jest.mock('../helpers/getAllDomains');

const RealDate = Date;

describe('censys banners', () => {
  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  test('basic test', async () => {
    await censysIpv4({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
