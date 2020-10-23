import {
  connectToDatabase,
  Domain,
  Organization,
  Scan,
  Webpage
} from '../../models';
import saveWebpagesToDb from '../helpers/saveWebpagesToDb';
jest.mock('../es-client');
const updateWebpages = require('../es-client').updateWebpages as jest.Mock;

describe('saveWebpagesToDb', () => {
  let organization;
  let scan;
  beforeAll(async () => {
    await connectToDatabase();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'webscraper',
      arguments: {},
      frequency: 999
    }).save();
  });
  test('create a new webpage', async () => {
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    const webpages = [
      {
        url: 'https://www.cisa.gov',
        domain: { id: domain.id },
        discoveredBy: { id: scan.id },
        status: 200,
        domain_name: '',
        response_size: 10,
        body: 'abc',
        headers: []
      }
    ];
    await saveWebpagesToDb(webpages);
    const newWebpage = updateWebpages.mock.calls[0][0][0];
    expect(newWebpage.webpage_id).toBeTruthy();
    expect(newWebpage.webpage_status).toEqual('200');
    expect(newWebpage.webpage_body).toEqual('abc');

    const webpage = (await Webpage.findOne(newWebpage.webpage_id)) as Webpage;
    expect(webpage.status).toEqual('200');
  });
  test('update an existing webpage', async () => {
    const name = 'test-' + Math.random();
    const domain = await Domain.create({
      name,
      organization
    }).save();
    let webpage = await Webpage.create({
      url: 'https://www.cisa.gov',
      status: 404,
      domain: { id: domain.id }
    }).save();
    const webpages = [
      {
        url: 'https://www.cisa.gov',
        domain: { id: domain.id },
        discoveredBy: { id: scan.id },
        status: 200,
        domain_name: '',
        response_size: 10,
        body: 'abc',
        headers: []
      }
    ];
    await saveWebpagesToDb(webpages);
    const newWebpage = updateWebpages.mock.calls[0][0][0];
    expect(newWebpage.webpage_id).toEqual(webpage.id);
    expect(newWebpage.webpage_status).toEqual('200');
    expect(newWebpage.webpage_body).toEqual('abc');

    webpage = (await Webpage.findOne(webpage.id)) as Webpage;
    expect(webpage.status).toEqual('200');
  });
});
