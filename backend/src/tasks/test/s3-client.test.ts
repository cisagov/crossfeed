import S3Client from '../s3-client';

const getObject = jest.fn();

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getObject: (e) => ({
      promise: getObject
    })
  }))
}));

describe('getWebpageBody', () => {
  test('success', async () => {
    getObject.mockImplementationOnce(async () => {
      return { Body: 'test body' };
    });
    const client = new S3Client();
    const body = await client.getWebpageBody('test_s3_key');
    expect(body).toEqual('test body');
  });
  test('404 not found should silently return nothing', async () => {
    getObject.mockImplementationOnce(async () => {
      throw {
        code: 'NoSuchKey',
        region: null,
        time: new Date('2020-10-02T13:47:23.164Z'),
        requestId: '88A469CA3B9DE7A6',
        extendedRequestId:
          'Boj3K6QNJJlzoqv/B3U+juIeFP/kfYz+Wtj4xMH+Gm8DZB5uUy2YSpsK4x5c24toiYDHGKXl0vo=',
        cfId: undefined,
        statusCode: 404,
        retryable: false,
        retryDelay: 5.606855739193417
      };
    });
    const client = new S3Client();
    const body = await client.getWebpageBody('test_s3_key');
    expect(body).toEqual('');
  });
});
