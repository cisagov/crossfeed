import { handler as nuclei } from '../nuclei';
import {
  connectToDatabase,
  Organization,
  Service,
  Domain,
  Vulnerability
} from '../../models';
import { spawnSync } from 'child_process';

jest.mock('child_process', () => ({
  spawnSync: jest.fn()
}));

const mockNucleiResponse = (response) => {
  (spawnSync as jest.Mock).mockImplementation(() => ({
    status: 0,
    stderr: '',
    stdout: response
  }));
};

describe('nuclei', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  let organization;
  beforeEach(async () => {
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  test('basic test', async () => {
    mockNucleiResponse(`{"template":"CVE-2018-5230","type":"http","matched":"https://google-gruyere.appspot.com/123456//pages/includes/status-list-mo%3CIFRAME%20SRC%3D%22javascript%3Aalert%281337%29%22%3E.vm","severity":"medium","author":"madrobot","description":""}
{"template":"CVE-2018-1000129","type":"http","matched":"https://google-gruyere.appspot.com/123456//api/jolokia/read%3Csvg%20onload=alert%28document.domain%29%3E?mimeType=text/html","severity":"high","author":"mavericknerd @0h1in9e","description":"An XSS vulnerability exists in the Jolokia agent version 1.3.7 in the HTTP servlet that allows an attacker to execute malicious javascript in the victim's browser."}
{"template":"CVE-2018-1000129","type":"http","matched":"https://google-gruyere.appspot.com/123456/:8080/jolokia/read%3Csvg%20onload=alert%28document.domain%29%3E?mimeType=text/html","severity":"high","author":"mavericknerd @0h1in9e","description":"An XSS vulnerability exists in the Jolokia agent version 1.3.7 in the HTTP servlet that allows an attacker to execute malicious javascript in the victim's browser."}`);
    const domain = await Domain.create({
      organization,
      name: 'google-gruyere.appspot.com',
      ip: '0.0.0.0'
    }).save();
    let service = await Service.create({
      service: 'https',
      port: 443,
      domain
    }).save();
    await nuclei({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
    service = await Service.findOneOrFail(service.id);
    expect(service.nucleiResults).toMatchSnapshot();
    const vulnerabilities = await Vulnerability.find({ domain });
    expect(vulnerabilities.length).toEqual(2);
    expect(vulnerabilities[0]).toMatchSnapshot({
      createdAt: expect.any(Date),
      lastSeen: expect.any(Date),
      id: expect.any(String)
    });
  });
});
