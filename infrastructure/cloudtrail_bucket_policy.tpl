{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Get CloudTrail Bucket ACL",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": ["s3:GetBucketAcl"],
      "Resource": ["arn:aws:s3:::${bucketName}"]
    },
    {
      "Sid": "Grant CloudTrail Permission to Write Logs",
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
      "Sid": "Require SSL for Requests",
      "Effect": "Deny",
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
