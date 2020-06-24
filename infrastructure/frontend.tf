resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_domain
  acl    = "private"

  tags = {
    Project = "Crossfeed"
  }
}

data "template_file" "policy_file" {
  template = "${file("frontend_bucket_policy.tpl")}"
  vars = {
    bucket_name = var.frontend_domain
  }
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = data.template_file.policy_file.rendered
}

resource "aws_acm_certificate" "frontend_cert" {
  domain_name       = var.frontend_domain
  provider          = aws.virginia #cert needs to be in us-east-1 for cloudfront
  validation_method = "DNS"
  tags = {
    Project = "Crossfeed"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  name            = aws_acm_certificate.frontend_cert.domain_validation_options.0.resource_record_name
  type            = aws_acm_certificate.frontend_cert.domain_validation_options.0.resource_record_type
  zone_id         = data.aws_route53_zone.zone.id
  records         = [aws_acm_certificate.frontend_cert.domain_validation_options.0.resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontend_cert" {
  provider                = aws.virginia
  certificate_arn         = aws_acm_certificate.frontend_cert.arn
  validation_record_fqdns = [aws_route53_record.frontend_cert_validation.fqdn]
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
    default_ttl            = 3600
    max_ttl                = 86400
  }

  tags = {
    Project = "Crossfeed"
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US"]
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
    acm_certificate_arn      = aws_acm_certificate.frontend_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1"
  }
}

resource "aws_route53_record" "frontend_domain" {
  name            = aws_acm_certificate.frontend_cert.domain_name
  type            = "A"
  zone_id         = data.aws_route53_zone.zone.id
  allow_overwrite = true


  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = true
  }
}
