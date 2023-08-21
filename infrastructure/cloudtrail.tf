resource "aws_cloudtrail" "management" {
  name = "management-events"
  type = "management"
  s3_bucket_name = "some-bucket"
  cloud_watch_logs_group_arn = "some-arn:*"
  kms_key_id                 = "arn:1234"
  enable_log_file_validation = true
  is_multi_region_trail      = true
}

resource "aws_cloudtrail" "data" {
  name           = "data-events"
  type           = "data"
  s3_bucket_name = "some-bucket"
  cloud_watch_logs_group_arn = "some-arn:*"
  kms_key_id                 = "arn:1234"
  enable_log_file_validation = true
  is_multi_region_trail      = true
}