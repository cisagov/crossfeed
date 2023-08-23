
resource "aws_cloudwatch_log_group" "all" {
  name              = var.logging_bucket_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudtrail" "all-events" {
  name           = "all-events"
  s3_bucket_name = var.logging_bucket_name
  retention_days = 3653
  cloud_watch_logs_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.logging_bucket_name}-cloudtrail-role"
  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.all.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3"]
    }
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }
  enable_log_file_validation = true
  is_multi_region_trail      = true
}