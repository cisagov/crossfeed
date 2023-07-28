resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
resource "aws_s3_bucket_versioning" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "frontend_bucket" {
  bucket        = aws_s3_bucket.frontend_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "frontend_bucket/"
}

data "template_file" "policy_file" {
  template = file("frontend_bucket_policy.tpl")
  vars = {
    bucket_name = var.frontend_bucket
  }
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = data.template_file.policy_file.rendered
}

locals {
  s3_origin_id = "myS3Origin"
}

resource "aws_iam_role" "frontend_lambda_iam" {
  name               = "frontend_lambda_iam_${var.stage}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_wafv2_web_acl" "default" {
  name  = "crossfeed-${var.stage}-default-acl-rule"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "crossfeed-${var.stage}-default-acl-metric"
    sampled_requests_enabled   = true
  }
}
