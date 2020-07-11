import {handler as censys} from '../censys';
jest.mock('../helpers/getRootDomains');
jest.mock('../helpers/saveDomainsToDb');

describe('censys', () => {
  test('basic test', async () => {
    await censys({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName'
    });
  });
});
