resource "aws_acm_certificate" "api_cert" {
  domain_name       = var.api_domain
  provider          = aws.virginia #cert needs to be in us-east-1 for sls
  validation_method = "DNS"
  tags = {
    Project = "Crossfeed"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_cert_validation" {
  name            = aws_acm_certificate.api_cert.domain_validation_options.0.resource_record_name
  type            = aws_acm_certificate.api_cert.domain_validation_options.0.resource_record_type
  zone_id         = data.aws_route53_zone.zone.id
  records         = [aws_acm_certificate.api_cert.domain_validation_options.0.resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "api_cert" {
  provider                = aws.virginia #cert needs to be in us-east-1 for sls
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [aws_route53_record.api_cert_validation.fqdn]
}
