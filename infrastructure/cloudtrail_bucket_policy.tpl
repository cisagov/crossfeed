{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck20121017",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": ["s3:GetBucketAcl"],
      "Resource": ["arn:aws:s3:::${bucketName}"]
    },
    {
      "Sid": "AWSCloudTrailWrite20121017",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": ["s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::${bucketName}/AWSLogs/${accountId}",
        "arn:aws:s3:::${bucketName}/AWSLogs/${accountId}/*"
      ],
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "RequireSSLRequests",
      "Action": "s3:*",
      "Effect": "Deny",
      "Principal": "*",
      "Resource": [
        "arn:aws:s3:::${bucketName}",
        "arn:aws:s3:::${bucketName}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
