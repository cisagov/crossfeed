resource "aws_s3_bucket" "infrastructure" {
  name = var.infrastructure_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_log_group" "infrastructure" {
  name              = var.infrastructure_log_group_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}