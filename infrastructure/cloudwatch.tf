resource "aws_s3_bucket" "cloudwatch_bucket" {
  bucket = var.cloudwatch_bucket_name
  tags = {
    project = var.project
    stage   = var.stage
  }
}

# TODO: update retention_in_days based on developing requirements
resource "aws_cloudwatch_log_group" "cloudwatch_bucket" {
  name              = var.cloudwatch_log_group_name
  retention_in_days = 365
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_s3_bucket_policy" "cloudwatch_bucket" {
  bucket = aws_s3_bucket.cloudwatch_bucket.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "Allow Cloudwatch to check bucket permissions",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "logs.amazonaws.com"
        },
        "Action" : "s3:GetBucketAcl",
        "Resource" : aws_s3_bucket.cloudwatch_bucket.arn
      },
      {
        "Sid" : "Allow Cloudwatch to write to bucket",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "logs.amazonaws.com"
        },
        "Action" : "s3:PutObject",
        "Resource" : [
          aws_s3_bucket.cloudwatch_bucket.arn,
          "${aws_s3_bucket.cloudwatch_bucket.arn}/*"
        ],
        "Condition" : {
          "StringEquals" : {
            "s3:x-amz-acl" : "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}