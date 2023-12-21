import { handler as censys } from '../censys';
import * as nock from 'nock';
jest.mock('../helpers/getRootDomains');
jest.mock('../helpers/saveDomainsToDb');

jest.mock('dns', () => ({
  promises: {
    lookup: async () => ({ address: '104.84.119.215' })
  }
}));

describe('censys', () => {
  afterAll(async () => {
    nock.cleanAll();
  });
  test('basic test', async () => {
    nock('https://search.censys.io')
      .post('/api/v2/certificates/search')
      .reply(200, {
        code: 200,
        status: 'OK',
        result: {
          query: 'cisa.gov',
          total: 5,
          duration_ms: 91,
          hits: [
            {
              names: ['cisa.gov', 'www.cisa.gov', 'www2.dhs.gov']
            },
            {
              names: ['gwids.cisa.gov', 'www.gwids.cisa.gov']
            },
            {
              names: ['certauth.fs.dhs.cisa.gov', 'fs.dhs.cisa.gov']
            },
            {
              names: ['origin-uat.gwids.cisa.gov', 'uat.gwids.cisa.gov']
            },
            {
              names: [
                'cybermarketplace.cisa.gov',
                'staging-cybermarketplace.cisa.gov'
              ]
            }
          ],
          links: {
            next: '',
            prev: ''
          }
        }
      });

    await censys({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'ddf56d43-7f87-4139-9a86-b8a1ffde9b9e',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
