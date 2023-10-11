resource "aws_iam_role" "splunk_role" {
  name = var.splunk_role_name
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Action = "sts:AssumeRole",
    }]
  })
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}
#TODO: add assume_role_policy to splunk service user: "Resource": "arn:aws:iam::123456789012:role/${var.splunk_role_name}

resource "aws_iam_role_policy" "splunk_policy" {
  name_prefix = "crossfeed-splunk-s3-${var.stage}"
  role        = aws_iam_role.splunk_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = [
        "s3:ListBucket",
        "s3:ListAllMyBuckets",
        "s3:GetObject",
        "s3:GetBucketLocation",
        "kms:Decrypt",
      ]
    }]
    Effect = "Allow",
    Resource = [
      aws_s3_bucket.cloudtrail_bucket.arn,
      aws_s3_bucket.logging_bucket.arn,
      aws_s3_bucket.cloudwatch_bucket.arn
    ]
  })
}