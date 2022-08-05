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
      this.s3 = new S3();
    }
  }

  /**
   * Saves the given JSON file as a CSV file in S3, then returns a
   * temporary URL that can be used to access it.
   * @param data Data to be saved as a CSV
   */
  async saveCSV(body: string, name: string = '') {
    try {
      const Key = `${Math.random()}/${name}-${new Date().toISOString()}.csv`;
      const params = {
        Bucket: process.env.EXPORT_BUCKET_NAME!,
        Key,
        Body: body,
        ContentType: 'text/csv'
      };
      await this.s3.putObject(params).promise();
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.EXPORT_BUCKET_NAME!,
        Key,
        Expires: 60 * 5 // 5 minutes
      });

      // Do this so exports are accessible when running locally.
      if (this.isLocal) {
        console.log(url.replace('minio:9000', 'localhost:9000'));
        return url.replace('minio:9000', 'localhost:9000');
      }
      return url;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * P&E Reports upload. Saves as a pdf in S3, then returns
   * a temporary URL that can be used to access it.
   */
  async uploadPeReport(orgName: string, fileName: string) {
    const Key = `pe-reports/${orgName}/${fileName}`;
    const params = {
      Bucket: process.env.EXPORT_BUCKET_NAME!,
      Key,
      Expires: 60 * 5, // 5 minutes
      ContentType: 'application/pdf'
    };
    try {
      const url = await this.s3.getSignedUrlPromise('putObject', params);
      // Do this so exports are accessible when running locally.
      if (this.isLocal) {
        return url.replace('minio:9000', 'localhost:9000');
      }
      return url;
    } catch (error) {
      console.error('Error while generating presigned URL:', error.message);
      throw new Error(error);
    }
  }
  async exportPeReport(Key: string) {
    try {
      try {
        await this.s3
          .headObject({ Bucket: process.env.EXPORT_BUCKET_NAME!, Key })
          .promise();
      } catch (e) {
        if (e.name === 'NotFound') {
          console.log('File does not exist in S3');
          return 'File does not exist';
        }
        console.log(e);
      }
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.EXPORT_BUCKET_NAME!,
        Key,
        Expires: 60 * 5 // 5 minutes
      });

      // Do this so exports are accessible when running locally.
      if (this.isLocal) {
        return url.replace('minio:9000', 'localhost:9000');
      }
      return url;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  async listPeReports(orgName: string) {
    try {
      const params = {
        Bucket: process.env.EXPORT_BUCKET_NAME!,
        Delimiter: '',
        Prefix: `pe-reports/${orgName}/`
      };

      const data = await this.s3
        .listObjects(params, function (err, data) {
          if (err) throw err;
        })
        .promise();
      return data.Contents;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export default S3Client;
