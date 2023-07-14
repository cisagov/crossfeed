import { getLiveWebsites, LiveDomain } from '../helpers/getLiveWebsites';
import { Domain, Service, connectToDatabase, Organization } from '../../models';
import { CommandOptions } from '../ecs-client';
import { handler } from '../wappalyzer';
import * as nock from 'nock';

const axios = require('axios');

jest.mock('../helpers/getLiveWebsites');
const getLiveWebsitesMock = getLiveWebsites as jest.Mock;

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
    technology: {
      name: 'jQuery',
      categories: [59],
      slug: 'jquery',
      url: [],
      headers: [],
      dns: [],
      cookies: [],
      dom: [],
      html: [],
      css: [],
      certIssuer: [],
      robots: [],
      meta: [],
      scripts: [[Object], [Object], [Object]],
      js: { 'jQuery.fn.jquery': [Array] },
      implies: [],
      excludes: [],
      icon: 'jQuery.svg',
      website: 'https://jquery.com',
      cpe: 'cpe:/a:jquery:jquery'
    },
    pattern: {
      value: 'jquery.*\\.js(?:\\?ver(?:sion)?=([\\d.]+))?',
      regex: /jquery.*\.js(?:\?ver(?:sion)?=([\d.]+))?/i,
      confidence: 100,
      version: '\\1'
    },
    version: ''
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
  let connection;

  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
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
    wappalyzer.mockReturnValueOnce([]).mockReturnValueOnce(wappalyzerResponse);

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

  test.only('saves exchange products properly', async () => {
    const wappalyzerResponse = [
      {
        technology: {
          name: 'Microsoft Exchange Server',
          categories: [30],
          slug: 'microsoft-exchange-server',
          icon: 'Microsoft.png',
          website:
            'https://www.microsoft.com/en-us/microsoft-365/exchange/email',
          cpe: 'cpe:/a:microsoft:exchange_server'
        },
        version: '15.2.595'
      }
    ];
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
    wappalyzer.mockReturnValueOnce([]).mockReturnValueOnce(wappalyzerResponse);

    await handler(commandOptions);
    scope.done();
    expect(wappalyzer).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenLastCalledWith(
      'Wappalyzer finished for organization organizationName on 2 domains'
    );
    const service1 = await Service.findOne(testServices[0].id);
    expect(service1?.wappalyzerResults).toEqual([]);

    const service2 = await Service.findOne(testServices[1].id);
    expect(service2?.wappalyzerResults).toEqual(wappalyzerResponse);

    expect(service2?.products).toEqual([
      {
        cpe: 'cpe:/a:microsoft:exchange_server:2019:cumulative_update_5',
        icon: 'Microsoft.png',
        name: 'Microsoft Exchange Server',
        tags: [],
        version: '15.2.595'
      }
    ]);
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
