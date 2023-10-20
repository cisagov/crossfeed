data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_ssm_parameter" "prod_api_domain" {
  name      = "/crossfeed/prod/DOMAIN"
  type      = "String"
  value     = "api.crossfeed.cyber.dhs.gov"
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "stage_api_domain" {
  name      = "/crossfeed/staging/DOMAIN"
  type      = "String"
  value     = "api.staging-cd.crossfeed.cyber.dhs.gov"
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_s3_bucket" "logging_bucket" {
  bucket = var.logging_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_policy" "logging_bucket" {
  bucket = aws_s3_bucket.logging_bucket.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [{
      "Sid" : "RequireSSLRequests",
      "Action" : "s3:*",
      "Effect" : "Deny",
      "Principal" : "*",
      "Resource" : [
        aws_s3_bucket.logging_bucket.arn,
        "${aws_s3_bucket.logging_bucket.arn}/*"
      ],
      "Condition" : {
        "Bool" : {
          "aws:SecureTransport" : "false"
        }
      }
    }]
  })
}

resource "aws_s3_bucket_acl" "logging_bucket" {
  bucket = aws_s3_bucket.logging_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "logging_bucket" {
  bucket = aws_s3_bucket.logging_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "logging_bucket" {
  bucket = aws_s3_bucket.logging_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "logging_bucket" {
  bucket        = aws_s3_bucket.logging_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "logging_bucket/"
}
