import { handler as whois } from '../whois';


describe('whois', () => {
  test('basic test', async () => {
    await whois({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'd0f51c16-a64a-4ed0-8373-d66485bfc678',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
