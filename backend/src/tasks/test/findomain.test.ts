import { handler as findomain } from '../findomain';
jest.mock('../helpers/getRootDomains');
jest.mock('../helpers/saveDomainsToDb');

jest.mock('fs', () => ({
  readFileSync: () =>
    `filedrop.cisa.gov,104.84.119.215\nwww.filedrop.cisa.gov,104.84.119.215`,
  unlinkSync: () => null
}));
jest.mock('child_process', () => ({
  spawnSync: () => null
}));

describe('findomain', () => {
  test('basic test', async () => {
    await findomain({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
