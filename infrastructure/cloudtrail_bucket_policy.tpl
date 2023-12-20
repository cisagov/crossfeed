{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws-us-gov:s3:::${bucketName}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": [
        "arn:aws-us-gov:s3:::${bucketName}/AWSLogs/${accountId}",
        "arn:aws-us-gov:s3:::${bucketName}/AWSLogs/${accountId}/*"
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
        "arn:aws-us-gov:s3:::${bucketName}",
        "arn:aws-us-gov:s3:::${bucketName}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Action": "s3:PutObject",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Resource": "arn:aws-us-gov:s3:::${bucketName}/*",
      "Sid": "S3PolicyStmt-DO-NOT-MODIFY-1697490065333"
    }
  ]
}
