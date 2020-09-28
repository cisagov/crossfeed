import { S3 } from 'aws-sdk';

/**
 * S3 Client. Normally, interacts with S3.
 * When the app is running locally, connects
 * to local S3 (minio) instead.
 */
class S3Client {
  s3: S3;
  isLocal: boolean;

  constructor(isLocal?: boolean) {
    this.isLocal =
      isLocal ??
      (process.env.IS_OFFLINE || process.env.IS_LOCAL ? true : false);
    if (this.isLocal) {
      this.s3 = new S3({
        endpoint: 'http://minio:9000',
        s3ForcePathStyle: true
      });
    } else {
      this.s3 = new S3({
        s3BucketEndpoint: false,
        endpoint: 'https://s3.amazonaws.com'
      });
    }
  }

  /**
   * Gets the latest body of a given webpage.
   * @param s3Key s3Key attribute of the webpage.
   */
  async getWebpageBody(s3Key: string) {
    const params = {
      Bucket: process.env.WEBSCRAPER_S3_BUCKET_NAME!,
      Key: `${s3Key}/latest/body.txt`
    };
    const data = await this.s3.getObject(params).promise();
    return data.Body?.toString('utf-8');
  }
}

export default S3Client;
