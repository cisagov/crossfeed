import { handler as dnstwist } from '../dnstwist';
import { connectToDatabase, Organization, Scan } from '../../models';

jest.mock('child_process', () => ({
  spawnSync: jest.fn()
}));

describe('dnstwist', () => {
  let scan;
  let organization;
  let connection;
  beforeEach(async () => {
    connection = await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-root-domain'],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'dnstwist',
      arguments: {},
      frequency: 999
    }).save();
  });

  test('basic test', async () => {
    await dnstwist({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
