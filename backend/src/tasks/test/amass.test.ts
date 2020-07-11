import { handler as amass } from '../amass';
jest.mock('../helpers/getRootDomains');
jest.mock('../helpers/saveDomainsToDb');

describe('amass', () => {
  test('basic test', async () => {
    await amass({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
