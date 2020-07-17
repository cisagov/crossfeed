import { handler as censysIpv4 } from "../censysIpv4";

jest.mock('../helpers/getCensysIpv4Data');
jest.mock('../helpers/saveDomainsToDb');
jest.mock('../helpers/saveServicesToDb');

describe('censys banners', () => {
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
