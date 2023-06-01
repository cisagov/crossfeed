import { handler as intrigueIdent } from '../intrigue-ident';
import { connectToDatabase, Organization, Service, Domain } from '../../models';
import { spawnSync } from 'child_process';

jest.mock('child_process', () => ({
  spawnSync: jest.fn()
}));

const mockIntrigueIdentResponse = (response) => {
  (spawnSync as jest.Mock).mockImplementation(() => ({
    status: 0,
    stderr: '',
    stdout:
      `
Fingerprint:
- Bootstrap Bootstrap   - boostrap css (CPE: cpe:2.3:a:bootstrap:bootstrap::) (Tags: ["Web Framework"]) (Hide: false)
- Apache HTTP Server   - Apache server header w/o version (CPE: cpe:2.3:a:apache:http_server::) (Tags: ["Web Server"]) (Hide: false)
- Apache HTTP Server   - Apache web server - server header - no version (CPE: cpe:2.3:a:apache:http_server::) (Tags: ["Web Server"]) (Hide: false)
- Drupal Drupal 8  - Drupal headers (CPE: cpe:2.3:a:drupal:drupal:8:) (Tags: ["CMS"]) (Hide: false)
- NewRelic NewRelic   - NewRelic tracking code (CPE: cpe:2.3:s:newrelic:newrelic::) (Tags: ["APM", "Javascript"]) (Hide: false)
` + JSON.stringify(response, null, 2)
  }));
};

describe('intrigue ident', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
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
    mockIntrigueIdentResponse({
      url: 'https://www.cisa.gov/',
      fingerprint: [
        {
          type: 'fingerprint',
          vendor: 'Bootstrap',
          product: 'Bootstrap',
          version: '',
          update: '',
          tags: ['Web Framework'],
          match_type: 'content_body',
          match_details: 'boostrap css',
          hide: false,
          cpe: 'cpe:2.3:a:bootstrap:bootstrap::',
          issue: null,
          task: null,
          inference: false
        },
        {
          type: 'fingerprint',
          vendor: 'Apache',
          product: 'HTTP Server',
          version: '',
          update: '',
          tags: ['Web Server'],
          match_type: 'content_headers',
          match_details: 'Apache server header w/o version',
          hide: false,
          cpe: 'cpe:2.3:a:apache:http_server::',
          issue: null,
          task: null,
          inference: false
        },
        {
          type: 'fingerprint',
          vendor: 'Apache',
          product: 'HTTP Server',
          version: '',
          update: '',
          tags: ['Web Server'],
          match_type: 'content_headers',
          match_details: 'Apache web server - server header - no version',
          hide: false,
          cpe: 'cpe:2.3:a:apache:http_server::',
          issue: null,
          task: null,
          inference: false
        },
        {
          type: 'fingerprint',
          vendor: 'Drupal',
          product: 'Drupal',
          version: '8',
          update: '',
          tags: ['CMS'],
          match_type: 'content_headers',
          match_details: 'Drupal headers',
          hide: false,
          cpe: 'cpe:2.3:a:drupal:drupal:8:',
          issue: null,
          task: null,
          inference: false
        },
        {
          type: 'fingerprint',
          vendor: 'NewRelic',
          product: 'NewRelic',
          version: '',
          update: '',
          tags: ['APM', 'Javascript'],
          match_type: 'content_body',
          match_details: 'NewRelic tracking code',
          hide: false,
          cpe: 'cpe:2.3:s:newrelic:newrelic::',
          issue: null,
          task: null,
          inference: null
        }
      ],
      content: [
        {
          type: 'content',
          name: 'Location Header',
          hide: null,
          issue: null,
          task: null,
          result: null
        },
        {
          type: 'content',
          name: 'Directory Listing Detected',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Form Detected',
          hide: false,
          issue: false,
          task: null,
          result: true
        },
        {
          type: 'content',
          name: 'File Upload Form Detected',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Email Addresses Detected',
          hide: false,
          issue: false,
          task: null,
          result: []
        },
        {
          type: 'content',
          name: 'Authentication - HTTP',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Authentication - NTLM',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Authentication - Forms',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Authentication - Session Identifier',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Access-Control-Allow-Origin Header',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'P3P Header',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'X-Frame-Options Header',
          hide: false,
          issue: false,
          task: null,
          result: true
        },
        {
          type: 'content',
          name: 'X-XSS-Protection Header',
          hide: null,
          issue: null,
          task: null,
          result: false
        },
        {
          type: 'content',
          name: 'Google Analytics',
          hide: null,
          issue: null,
          task: null,
          result: null
        },
        {
          type: 'content',
          name: 'Google Site Verification',
          hide: null,
          issue: null,
          task: null,
          result: null
        },
        {
          type: 'content',
          name: 'MyWebStats',
          hide: null,
          issue: null,
          task: null,
          result: null
        }
      ],
      responses: [],
      initial_checks: [
        {
          url: 'https://www.cisa.gov/',
          count: 676
        }
      ],
      followon_checks: []
    });
    const domain = await Domain.create({
      organization,
      name: 'www.cisa.gov',
      ip: '0.0.0.0'
    }).save();
    let service = await Service.create({
      service: 'https',
      port: 443,
      domain
    }).save();
    await intrigueIdent({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
    service = await Service.findOneOrFail(service.id);
    expect(service.intrigueIdentResults).toMatchSnapshot();
    expect(service.products).toMatchSnapshot();
  });
});
