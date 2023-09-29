resource "aws_iam_role" "splunk_role" {
  name = var.splunk_role_name
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_iam_role_policy" "splunk_policy" {
  name_prefix = "crossfeed-splunk-s3-${var.stage}"
  role        = aws_iam_role.splunk_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = [
        "s3:Get*",
        "s3:List*",
        "s3:Describe*",
        "s3-object-lambda:Get*",
        "s3-object-lambda:List*"
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