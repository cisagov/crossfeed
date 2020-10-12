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

beforeAll(async () => {
  await connectToDatabase();
  domain = Domain.create({
    name: 'first_file_testdomain5',
    ip: '45.79.207.117'
  });
  webpage = Webpage.create({
    domain,
    url: 'https://cisa.gov/123',
    status: 200,
    updatedAt: new Date('9999-08-23T03:36:57.231Z'),
    s3Key: 'testS3key'
  });
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
    await client.updateWebpages(Array(1).fill(webpage));
    expect(bulk).toBeCalledTimes(1);
    expect((bulk.mock.calls[0] as any)[0].datasource.length).toEqual(1);
  });
});
