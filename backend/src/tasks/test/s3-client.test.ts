import S3Client from '../s3-client';

const getSignedUrlPromise = jest.fn(() => 'http://signed_url');
const putObject = jest.fn();

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    putObject: (e) => ({
      promise: putObject
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
