import { connectToDatabase, Domain, Webpage } from '../../models';
import ESClient from '../es-client';

const bulk = jest.fn(() => ({}));
jest.mock('@elastic/elasticsearch', () => {
  class Client {
    helpers = {
      bulk
    };
  }
  return { Client };
});

let domain;
let webpage;
let connection;

beforeAll(async () => {
  connection = await connectToDatabase();
  domain = Domain.create({
    name: 'first_file_testdomain5',
    ip: '45.79.207.117'
  });
  webpage = Webpage.create({
    domain,
    url: 'https://cisa.gov/123',
    status: 200,
    updatedAt: new Date('9999-08-23T03:36:57.231Z')
  });
});

afterAll(async () => {
  await connection.close();
});

describe('updateDomains', () => {
  test('test', async () => {
    const client = new ESClient();
    await client.updateDomains(Array(1).fill(domain));
    expect(bulk).toBeCalledTimes(1);
    expect((bulk.mock.calls[0] as any)[0].datasource.length).toEqual(1);
  });
});

describe('updateWebpages', () => {
  test('test', async () => {
    const client = new ESClient();
    await client.updateWebpages([
      {
        webpage_id: 'webpage_id',
        webpage_createdAt: new Date('2020-10-17T22:21:17Z'),
        webpage_updatedAt: new Date('2020-10-17T22:21:17Z'),
        webpage_syncedAt: new Date('2020-10-17T22:21:17Z'),
        webpage_lastSeen: new Date('2020-10-17T22:21:17Z'),
        webpage_url: 'url',
        webpage_status: 200,
        webpage_domainId: 'domainId',
        webpage_discoveredById: 'webpage_discoveredById',
        webpage_responseSize: 5000,
        webpage_headers: [{ name: 'a', value: 'b' }],
        webpage_body: 'test body'
      }
    ]);
    expect(bulk).toBeCalledTimes(1);
    expect((bulk.mock.calls[0] as any)[0].datasource.length).toEqual(1);
    expect((bulk.mock.calls[0] as any)[0].datasource).toMatchSnapshot();
  });
});
