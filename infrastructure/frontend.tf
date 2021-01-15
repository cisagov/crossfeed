resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket
  acl    = "private"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

data "template_file" "policy_file" {
  template = "${file("frontend_bucket_policy.tpl")}"
  vars = {
    bucket_name = var.frontend_bucket
  }
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = data.template_file.policy_file.rendered
}

locals {
  s3_origin_id = "myS3Origin"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = local.s3_origin_id
  }

  aliases = [var.frontend_domain]

  enabled             = true
  is_ipv6_enabled     = true
  comment             = var.cloudfront_name
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 2628000
    max_ttl                = 2628000
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = var.frontend_cert_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
}
