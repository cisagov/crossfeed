import { handler as portscanner } from '../portscanner';
jest.mock('../helpers/getIps');
jest.mock('../helpers/saveServicesToDb');

jest.mock('portscanner', () => ({
  checkPortStatus: (port, ip) => {
    return port === 443 || port === 80 ? 'open' : 'closed';
  }
}));

const RealDate = Date;

describe('portscanner', () => {
  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
  });
  test('basic test', async () => {
    await portscanner({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
