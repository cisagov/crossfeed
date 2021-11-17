data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

resource "aws_elasticsearch_domain" "es" {
  domain_name           = "crossfeed-${var.stage}"
  elasticsearch_version = "7.7"

  cluster_config {
    instance_type            = var.es_instance_type
    instance_count           = var.es_instance_count
    dedicated_master_enabled = false

    # Enable for prod:
    # zone_awareness_enabled = true
    # zone_awareness_config {
    #   availability_zone_count = 2
    # }
  }

  # Allow all IPs within the private subnet to access this domain.
  # This allows us to make requests to this ES domain without
  # having to AWS-sign each request.
  access_policies = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "es:ESHttp*",
      "Principal": "*",
      "Effect": "Allow",
      "Resource": "arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/crossfeed-${var.stage}/*"
    }
  ]
}
POLICY

  vpc_options {
    subnet_ids         = [aws_subnet.es_1.id]
    security_group_ids = [aws_security_group.allow_internal.id]
  }

  #   Only supported on certain instance types, so let's only enable this on prod: https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-supported-instance-types.html
  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  snapshot_options {
    automated_snapshot_start_hour = 0
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_application.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_index_slow.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_search_slow.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.es_instance_volume_size
  }

  tags = {
    Project = var.project
  }
}

resource "aws_cloudwatch_log_resource_policy" "es" {
  policy_name     = "crossfeed-${var.stage}"
  policy_document = <<CONFIG
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": [
        "logs:PutLogEvents",
        "logs:PutLogEventsBatch",
        "logs:CreateLogStream"
      ],
      "Resource": "arn:aws:logs:*"
    }
  ]
}
CONFIG
}

resource "aws_cloudwatch_log_group" "es_application" {
  name              = "crossfeed-${var.stage}-es-application"
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_log_group" "es_index_slow" {
  name              = "crossfeed-${var.stage}-es-index-slow"
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_log_group" "es_search_slow" {
  name              = "crossfeed-${var.stage}-es-search-slow"
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ssm_parameter" "es_endpoint" {
  name      = "/crossfeed/${var.stage}/ELASTICSEARCH_ENDPOINT"
  type      = "String"
  value     = "https://${aws_elasticsearch_domain.es.endpoint}"
  overwrite = true

  tags = {
    Project = var.project
  }
}
