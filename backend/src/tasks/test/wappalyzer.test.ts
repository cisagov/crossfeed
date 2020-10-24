import { mocked } from 'ts-jest/utils';
import { getLiveWebsites, LiveDomain } from '../helpers/getLiveWebsites';
import { Domain, Service, connectToDatabase, Organization } from '../../models';
import { CommandOptions } from '../ecs-client';
import { handler } from '../wappalyzer';
import * as nock from 'nock';

const axios = require('axios');

jest.mock('../helpers/getLiveWebsites');
const getLiveWebsitesMock = mocked(getLiveWebsites);

jest.mock('../helpers/simple-wappalyzer');
const wappalyzer = require('../helpers/simple-wappalyzer')
  .wappalyzer as jest.Mock;

const logSpy = jest.spyOn(console, 'log');
const errSpy = jest.spyOn(console, 'error');

const httpsService = new Service();
httpsService.port = 443;

const httpService = new Service();
httpService.port = 80;

const wappalyzerResponse = [
  {
    name: 'Drupal',
    slug: 'drupal',
    categories: [{ id: 1, slug: 'cms', name: 'CMS', priority: 1 }],
    confidence: 100,
    version: '8',
    icon: 'Drupal.svg',
    website: 'https://drupal.org',
    cpe: 'cpe:/a:drupal:drupal'
  }
];

const commandOptions: CommandOptions = {
  organizationId: 'organizationId',
  organizationName: 'organizationName',
  scanId: '0fce0882-234a-4f0e-a0d4-e7d6ed50c3b9',
  scanName: 'scanName',
  scanTaskId: 'scanTaskId'
};

describe('wappalyzer', () => {
  let testDomain: LiveDomain;

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(() => {
    testDomain = new Domain() as LiveDomain;
    testDomain.url = '';
    testDomain.name = 'example.com';
    getLiveWebsitesMock.mockResolvedValue([]);
    wappalyzer.mockResolvedValue([]);
  });

  afterEach(() => {
    getLiveWebsitesMock.mockReset();
    wappalyzer.mockReset();
    nock.cleanAll();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('logs status message', async () => {
    const expected = 'Running wappalyzer on organization';
    await handler(commandOptions);
    expect(logSpy).toHaveBeenCalledWith(
      expected,
      commandOptions.organizationName
    );
  });

  test('gets live websites based on provided org id', async () => {
    await handler(commandOptions);
    expect(getLiveWebsitesMock).toHaveBeenCalledTimes(1);
    expect(getLiveWebsitesMock).toHaveBeenCalledWith(
      commandOptions.organizationId
    );
  });

  test('calls https for domain with port 443', async () => {
    testDomain.services = [httpsService];
    testDomain.url = 'https://example.com';
    testDomain.service = httpsService;
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    const scope = nock('https://example.com')
      .get('/')
      .times(1)
      .reply(200, 'somedata');
    await handler(commandOptions);
    scope.done();
  });

  test('calls http for domains without port 443', async () => {
    testDomain.url = 'http://example.com';
    testDomain.service = httpService;
    testDomain.services = [httpService];
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    const scope = nock('http://example.com')
      .get('/')
      .times(1)
      .reply(200, 'somedata');
    await handler(commandOptions);
    scope.done();
  });

  test('saves domains to database that have a result', async () => {
    const scope = nock(/https?:\/\/example2?\.com/)
      .persist()
      .get('/')
      .times(2)
      .reply(200, 'somedata');
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const testServices = [
      await Service.create({
        port: 443
      }).save(),
      await Service.create({
        port: 443
      }).save()
    ] as Service[];
    const testDomains = [
      await Domain.create({
        ...testDomain,
        services: [testServices[0]],
        organization
      }).save(),
      await Domain.create({
        ...testDomain,
        name: 'example2.com',
        services: [testServices[1]],
        organization
      }).save()
    ] as LiveDomain[];
    testDomains[0].url = 'https://example2.com';
    testDomains[0].service = testServices[0];
    testDomains[1].url = 'https://example2.com';
    testDomains[1].service = testServices[1];
    getLiveWebsitesMock.mockResolvedValue(testDomains);
    wappalyzer
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(wappalyzerResponse);

    await handler(commandOptions);
    scope.done();
    expect(wappalyzer).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenLastCalledWith(
      'Wappalyzer finished for 2 domains'
    );
    const service1 = await Service.findOne(testServices[0].id);
    expect(service1?.wappalyzerResults).toEqual([]);

    const service2 = await Service.findOne(testServices[1].id);
    expect(service2?.wappalyzerResults).toEqual(wappalyzerResponse);
  });

  test('logs error on wappalyzer failure', async () => {
    testDomain.services = [httpsService];
    testDomain.url = 'https://example.com';
    testDomain.service = httpsService;
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    nock('http://example.com').get('/').reply(200, 'somedata');
    const err = new Error('testerror');
    wappalyzer.mockRejectedValue(err);
    await handler(commandOptions);
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith(err);
  });

  test('logs error on axios failure', async () => {
    axios.get = jest.fn();
    testDomain.services = [httpsService];
    testDomain.url = 'https://example.com';
    testDomain.service = httpsService;
    nock('http://example.com').get('/').replyWithError('network error');
    const err = new Error('testerror');
    axios.get.mockRejectedValue(err);
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    await handler(commandOptions);
    expect(errSpy).toHaveBeenCalledTimes(1);
  });
});
