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
  tags = {
    Project = var.project
    Stage   = var.stage
  }
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

resource "aws_s3_bucket" "pe_reports_bucket" {
  bucket = var.pe_reports_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_reports_bucket" {
  bucket        = aws_s3_bucket.pe_reports_bucket.id
  target_bucket = aws_s3_bucket.pe_reports_bucket.id
  target_prefix = "pe_reports_bucket/"
}

resource "aws_s3_bucket" "pe_db_backups_bucket" {
  bucket = var.db_backups_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_db_backups_bucket" {
  bucket        = aws_s3_bucket.pe_db_backups_bucket.id
  target_bucket = aws_s3_bucket.pe_db_backups_bucket.id
  target_prefix = "pe_db_backups_bucket/"
}
