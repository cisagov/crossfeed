resource "aws_s3_bucket" "cloudwatch_bucket" {
  bucket = var.cloudwatch_bucket_name
  tags = {
    project = var.project
    stage   = var.stage
  }
}

# TODO: update retention_in_days based on developing requirements
resource "aws_cloudwatch_log_group" "cloudwatch_bucket" {
  bucket = var.cloudwatch_bucket_name
  retention_in_days = 365
  kms_key_id = aws_kms_key.key.arn
  tags = {
    project = var.project
    stage   = var.stage
  }
}