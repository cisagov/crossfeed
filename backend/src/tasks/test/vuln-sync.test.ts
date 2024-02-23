import { connect } from 'http2';
import * as nock from 'nock';
import { connectToDatabase, Scan } from '../../models';
import { handler as vulnSync } from '../vuln-sync';

const taskResponse = {
  task_id: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
  status: 'Processing'
};
const dataResponse = {
  task_id: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
  status: 'Completed',
  result: [
    {
      title: 'CVE-0000-0000',
      cve: 'CVE-0000-0000',
      cvss: '1.0',
      state: 'open',
      severity: 'high',
      source: 'Shodan',
      needsPopulation: false,
      port: 9999,
      lastSeen: '2022-02-28 09:12:55.092',
      banner: 'none',
      serviceSource: 'testSource',
      product: 'testProduct',
      version: '1.0',
      cpe: 'testCpe',
      service_asset: 'test.net',
      service_port: 9999,
      service_asset_type: 9999
    },
    {
      title: 'CVE-0000-0001',
      cve: 'CVE-0000-0001',
      cvss: '1.0',
      state: 'open',
      severity: 'high',
      source: 'Shodan',
      needsPopulation: false,
      port: 9999,
      lastSeen: '2022-02-28 09:12:55.092',
      banner: 'none',
      serviceSource: 'testSource',
      product: 'testProduct',
      version: '1.0',
      cpe: 'testCpe',
      service_asset: 'test.net',
      service_port: 9999,
      service_asset_type: 9999
    },
    {
      title: 'CVE-0000-0002',
      cve: 'CVE-0000-0002',
      cvss: '1.0',
      state: 'open',
      severity: 'high',
      source: 'Shodan',
      needsPopulation: false,
      port: 9999,
      lastSeen: '2022-02-28 09:12:55.092',
      banner: 'none',
      serviceSource: 'testSource',
      product: 'testProduct',
      version: '1.0',
      cpe: 'testCpe',
      service_asset: 'test.net',
      service_port: 9999,
      service_asset_type: 9999
    }
  ]
};
describe('vuln-sync', () => {
  let scan;
  let connection;
  beforeEach(async () => {
    connection = await connectToDatabase();
    scan = await Scan.create({
      name: 'cve-sync',
      arguments: {},
      frequency: 999
    }).save();
  });
  afterEach(async () => {
    await connection.close();
  });
  afterAll(async () => {
    nock.cleanAll();
  });
  test('baseline', async () => {
    nock('https://api.staging-cd.crossfeed.cyber.dhs.gov')
      .get(
        '/pe/apiv1/crossfeed_vulns/task/6c84fb90-12c4-11e1-840d-7b25c5ee775a'
      )
      .reply(200, dataResponse)
      .post('/pe/apiv1/crossfeed_vulns')
      .reply(200, taskResponse);
    await vulnSync({
      organizationId: '7127132d-eb29-4948-94c4-5a9525b74c85',
      organizationName: 'GLOBAL SCAN',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
