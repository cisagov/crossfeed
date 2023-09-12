resource "aws_cloudwatch_log_group" "infrastructure" {
  name              = var.infrastructure_log_group_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket" "infrastructure_bucket" {
  name = var.infrastructure_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "infrastructure_bucket" {
  bucket = aws_s3_bucket.infrastructure_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "infrastructure_bucket" {
  bucket = aws_s3_bucket.infrastructure_bucket.id
}

resource "aws_s3_bucket_logging" "infrastructure_bucket" {
  bucket        = aws_s3_bucket.infrastructure_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "infrastructure_bucket/"
}

data "template_file" "infrastructure_bucket_policy" {
  template = file("infrastructure_bucket_policy.tpl")
  vars = {
    accountId = data.aws_caller_identity.current.account_id
    bucketName = var.infrastructure_bucket_name
  }
}