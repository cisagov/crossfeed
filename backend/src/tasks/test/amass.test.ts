import { handler as amass } from '../amass';
jest.mock('../helpers/getRootDomains');
jest.mock('../helpers/saveDomainsToDb');

jest.mock('fs', () => ({
  readFileSync: () => `{"name":"filedrop.cisa.gov","domain":"cisa.gov","addresses":[{"ip":"2a02:26f0:7a00:195::447a","cidr":"2a02:26f0:7a00::/48","asn":6762,"desc":"SEABONE-NET TELECOM ITALIA SPARKLE S.p.A."},{"ip":"2a02:26f0:7a00:188::447a","cidr":"2a02:26f0:7a00::/48","asn":6762,"desc":"SEABONE-NET TELECOM ITALIA SPARKLE S.p.A."}],"tag":"dns","source":"DNS"}
{"name":"www.filedrop.cisa.gov","domain":"cisa.gov","addresses":[{"ip":"2a02:26f0:7a00:188::447a","cidr":"2a02:26f0:7a00::/48","asn":6762,"desc":"SEABONE-NET TELECOM ITALIA SPARKLE S.p.A."},{"ip":"2a02:26f0:7a00:195::447a","cidr":"2a02:26f0:7a00::/48","asn":6762,"desc":"SEABONE-NET TELECOM ITALIA SPARKLE S.p.A."}],"tag":"cert","source":"Crtsh"}`,
  unlinkSync: () => null
}));
jest.mock('child_process', () => ({
  spawnSync: () => null
}));

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
