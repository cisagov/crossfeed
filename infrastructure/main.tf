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
  value     = "api.staging.crossfeed.cyber.dhs.gov"
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_s3_bucket" "logging_bucket" {
  bucket = var.logging_bucket_name
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  versioning {
    enabled    = true
    mfa_delete = false
  }

  logging {
    target_bucket = var.logging_bucket_name
    target_prefix = "logging_bucket/"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}
