import { handler as webscraper } from '../webscraper';
import { connectToDatabase, Organization, Service, Domain, Webpage, Scan } from '../../models';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

jest.mock('child_process', () => ({
  spawnSync: jest.fn().mockImplementationOnce(() => ({
    status: 0,
    stderr: '',
    stdout: `scrapy stdout`
  })).mockImplementationOnce(() => ({
    status: 0,
    stderr: '',
    stdout: `aws s3 sync stdout`
  }))
}));

jest.mock('fs', () => ({
  // scrapy output
  readFileSync: jest.fn().mockImplementation(() => `{"s3_key": "5d1ec4072fee8b04b26fe8f400eef551f9498445eeff64f38695bee7f5435c04", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "1de6816e1b0d07840082bed89f852b3f10688a5df6877a97460dbc474195d5dd", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/scans/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "6a2946030f804a281a0141397dbd948d7cae4698118bffd1c58e6d5f87480435", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/contributing/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "d8f190dfeaba948e31fc26e3ab7b7c774b1fbf1f6caac535e4837595eadf4795", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/usage/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "5d1ec4072fee8b04b26fe8f400eef551f9498445eeff64f38695bee7f5435c04", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "226706ff585e907aa977323c404b9889f3b2e547d134060ed57fda2e2f1b9860", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/contributing/deployment/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "e1448fa789c02ddc90a37803150923359a4a21512e1737caec52be53ef3aa3b5", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/contributing/architecture/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "3091ca75bf2ee1e0bead7475adb2db8362f96b472d220fd0c29eaac639cdf37f", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/usage/customization/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "dd7e7e51a4a094e87ad88756842854c2d878ac55fb908035ddaf229c5568fa1a", "status": 200, "url": "https://docs.crossfeed.cyber.dhs.gov/usage/administration/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "afb6378d30bd1b43d86be5d1582d0e306ba6c9dd2c60f0dcbb1a3837b34cbe59", "status": 400, "url": "https://docs.crossfeed.cyber.dhs.gov/contributing/setup/", "domain_name": "docs.crossfeed.cyber.dhs.gov"}
{"s3_key": "afb6378d30bd1b43d86be5d1582d0e306ba6c9dd2c60f0dcbb1a3837b34cbe60", "status": 200, "url": "https://unrelated-url.cyber.dhs.gov/contributing/setup/", "domain_name": "unrelated-url.cyber.dhs.gov"}
  `),
  writeFileSync: jest.fn(),
}));

describe('webscraper', () => {
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
    const scan = await Scan.create({
      name: 'webscraper',
      arguments: {},
      frequency: 999
    }).save();
    const domain = await Domain.create({
      organization,
      name: 'docs.crossfeed.cyber.dhs.gov',
      ip: '0.0.0.0'
    }).save();
    let service = await Service.create({
      service: 'https',
      port: 443,
      domain
    }).save();
    await webscraper({
      organizationId: organization.id,
      organizationName: 'organizationName',
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 1
    });
    const webpages = await Webpage.find({
      where: { domain },
      relations: ['discoveredBy']
    });
    expect((spawnSync as jest.Mock).mock.calls.map(e => [e[0], e[1]])).toMatchSnapshot();
    expect((readFileSync as jest.Mock).mock.calls).toMatchSnapshot();
    expect((writeFileSync as jest.Mock).mock.calls).toMatchSnapshot();
    expect(webpages.map(e => e.url)).toMatchSnapshot();
    expect(webpages.map(e => e.status)).toMatchSnapshot();
    expect(webpages.filter(e => e.discoveredBy.id !== scan.id)).toEqual([]);
  });
});
