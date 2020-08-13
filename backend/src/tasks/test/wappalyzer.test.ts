import { mocked } from 'ts-jest/utils';
import axios from 'axios';
import getLiveWebsites from '../helpers/getLiveWebsites';
import wappalyzer from 'simple-wappalyzer';
import { Domain, Service } from '../../models';
import { CommandOptions } from '../ecs-client';
import { handler } from '../wappalyzer';
import saveDomainsToDb from '../helpers/saveDomainsToDb';

jest.mock('axios');
const axiosMock = mocked(axios, true);

jest.mock('../helpers/getLiveWebsites');
const getLiveWebsitesMock = mocked(getLiveWebsites);

jest.mock('../helpers/saveDomainsToDb');
const saveDomainsToDbMock = mocked(saveDomainsToDb);

// @ts-ignore
jest.mock('simple-wappalyzer', () => ({
  default: jest.fn()
}));

const logSpy = jest.spyOn(console, 'log');
const errSpy = jest.spyOn(console, 'error');

const httpsService = new Service();
httpsService.port = 443;

const httpService = new Service();
httpService.port = 80;

const apiResponse = {
  data: 'testdata',
  status: 200,
  headers: {}
};

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
  scanId: 'scanId',
  scanName: 'scanName',
  scanTaskId: 'scanTaskId'
};

describe('wappalyzer', () => {
  let testDomain: Domain;

  beforeAll(() => {
    saveDomainsToDbMock.mockResolvedValue();
  });

  beforeEach(() => {
    testDomain = new Domain();
    testDomain.name = 'example.com';
    axiosMock.get.mockResolvedValue(apiResponse);
    getLiveWebsitesMock.mockResolvedValue([]);
    wappalyzer.mockResolvedValue([]);
    logSpy.mockImplementation(() => {});
    errSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    axiosMock.get.mockReset();
    getLiveWebsitesMock.mockReset();
    wappalyzer.mockReset();
    saveDomainsToDbMock.mockReset();
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
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    const res = await handler(commandOptions);
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.get.mock.calls[0][0]).toEqual('https://example.com');
  });

  test('calls http for domains without port 443', async () => {
    testDomain.services = [httpService];
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    await handler(commandOptions);
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.get.mock.calls[0][0]).toEqual('http://example.com');
  });

  test('saves domains to database that have a result', async () => {
    const testDomains = [
      {
        ...testDomain,
        services: [httpsService]
      },
      {
        ...testDomain,
        name: 'example2.com',
        services: [httpService]
      }
    ] as Domain[];
    getLiveWebsitesMock.mockResolvedValue(testDomains);
    wappalyzer
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(wappalyzerResponse);
    await handler(commandOptions);
    expect(axiosMock.get).toHaveBeenCalledTimes(2);
    const calledUrls = axiosMock.get.mock.calls.map((call) => call[0]);
    expect(calledUrls).toContain('http://example2.com');
    expect(calledUrls).toContain('https://example.com');
    expect(saveDomainsToDbMock).toHaveBeenCalledTimes(1);
    // only the domain with results was saved
    expect(saveDomainsToDbMock.mock.calls).toHaveLength(1);
    expect(logSpy).toHaveBeenLastCalledWith(
      'Wappalyzer finished for 1 domains'
    );
  });

  test('logs error on wappalyzer failure', async () => {
    testDomain.services = [];
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    const err = new Error('testerror');
    wappalyzer.mockRejectedValue(err);
    await handler(commandOptions);
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith(err);
  });

  test('logs error on axios failure', async () => {
    testDomain.services = [];
    getLiveWebsitesMock.mockResolvedValue([testDomain]);
    const err = new Error('testerror');
    axiosMock.get.mockRejectedValue(err);
    await handler(commandOptions);
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith(err);
  });
});
