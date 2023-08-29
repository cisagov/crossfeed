{
    "Version" : "2012-10-17",
    "Statement" : [
        {
            "Sid" : "AWSCloudTrailAclCheck20150319",
            "Effect" : "Allow",
            "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
            "Action" : "s3:GetBucketAcl",
            "Resource" : "arn:aws:s3:::${bucketName}",
            "Condition" : {
                "StringEquals" : {
                    "aws:SourceArn" : "arn:aws:cloudtrail:${var.aws_region}:957221700844:trail/${aws_cloudtrail.all-events.name}"
                }
            }
        },
        {
            "Sid" : "AWSCloudTrailWrite20150319",
            "Effect" : "Allow",
            "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
            "Action" : "s3:PutObject",
            "Resource" : "arn:aws:s3:::${bucketName}/${aws_s3_bucket_logging.cloudtrail_bucket.target_prefix}/AWSLogs/957221700844/*",
            "Condition" : {
                "StringEquals" : {
                    "s3:x-amz-acl" : "bucket-owner-full-control",
                    "aws:SourceArn" : "arn:aws:cloudtrail:${var.aws_region}:957221700844:trail/${aws_cloudtrail.all-events.name}"
                }
            }
        }
    ]
}