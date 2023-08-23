
resource "aws_cloudwatch_log_group" "all" {
  name              = var.logging_bucket_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudtrail" "management" {
  name                          = "management-events"
  s3_bucket_name                = "management-bucket"
  aws_cloudwatch_logs_group_arn = aws_cloudwatch_log_group.all.arn
  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
  enable_log_file_validation = true
  is_multi_region_trail      = true
}

resource "aws_cloudtrail" "data" {
  name                          = "data-events"
  s3_bucket_name                = "data-bucket"
  aws_cloudwatch_logs_group_arn = aws_cloudwatch_log_group.all.arn
  event_selector {
    read_write_type           = "All"
    include_management_events = false
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