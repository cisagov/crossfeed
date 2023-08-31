
resource "aws_cloudtrail" "all-events" {
  name                       = "all-events"
  s3_bucket_name             = var.cloudtrail_bucket_name
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.cloudtrail_role_name}"
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

resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = var.cloudtrail_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = var.cloudtrail_bucket_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "cloudtrail_bucket" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_bucket" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "cloudtrail_bucket" {
  bucket        = aws_s3_bucket.cloudtrail_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "cloudtrail_bucket/"
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  policy = data.template_file.cloudtrail_bucket_policy.rendered
}

resource "aws_iam_role" "cloudtrail_role" {
  name               = var.cloudtrail_role_name
  assume_role_policy = aws_s3_bucket_policy.cloudtrail_bucket.policy
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

data "template_file" "cloudtrail_bucket_policy" {
  template = file("cloudtrail_bucket_policy.tpl")
  vars = {
    bucketName = var.cloudtrail_bucket_name
    prefix     = aws_s3_bucket_logging.cloudtrail_bucket.target_prefix
    roleName   = var.cloudtrail_role_name
    trailName  = aws_cloudtrail.all-events.name
    accountId  = data.aws_caller_identity.current.account_id
    region     = var.aws_region
  }
}