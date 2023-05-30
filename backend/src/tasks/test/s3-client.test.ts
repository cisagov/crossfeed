import S3Client from '../s3-client';

const getSignedUrlPromise = jest.fn(() => 'http://signed_url');
const listObjects = jest.fn(() => ({ Contents: 'report content' }));
const putObject = jest.fn();

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    putObject: (e) => ({
      promise: putObject
    }),
    listObjects: (e) => ({
      promise: listObjects
    }),
    getSignedUrlPromise: getSignedUrlPromise
  }))
}));

describe('saveCSV', () => {
  test('gets url', async () => {
    const client = new S3Client();
    const result = await client.saveCSV('data');
    expect(result).toEqual('http://signed_url');
    expect(putObject).toBeCalled();
  });
});

describe('listReports', () => {
  test('gets content', async () => {
    const client = new S3Client();
    const result = await client.listReports('data');
    expect(result).toEqual('report content');
    expect(listObjects).toBeCalled();
  });
});

describe('exportReport', () => {
  test('gets content', async () => {
    const client = new S3Client();
    const result = await client.exportReport('data', 'orgId');
    expect(result).toEqual('http://signed_url');
  });
});
