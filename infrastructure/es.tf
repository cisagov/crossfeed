resource "aws_elasticsearch_domain" "es" {
  domain_name           = "crossfeed-${var.stage}"
  elasticsearch_version = "7.7"

  cluster_config {
    instance_type = "t2.small.elasticsearch"
    instance_count = 1
    dedicated_master_enabled = false
    
    # Enable for prod:
    # zone_awareness_enabled = true
    # zone_awareness_config {
    #   availability_zone_count = 2
    # }
  }

  vpc_options {
    subnet_ids         = [aws_subnet.es_1.id]
    security_group_ids = [aws_security_group.allow_internal.id]
  }

  #   Only supported on certain instance types, so let's only enable this on prod: https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-supported-instance-types.html
  encrypt_at_rest {
    enabled = false
  }

  node_to_node_encryption {
    enabled = true
  }

  snapshot_options {
    automated_snapshot_start_hour = 0
  }

  domain_endpoint_options {
    enforce_https = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_application.arn
    log_type = "ES_APPLICATION_LOGS"
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }

  tags = {
    Project = var.project
  }

  depends_on = [aws_iam_service_linked_role.es]
}

resource "aws_iam_service_linked_role" "es" {
  aws_service_name = "es.amazonaws.com"
}

resource "aws_cloudwatch_log_resource_policy" "es" {
  policy_name = "crossfeed-${var.stage}"
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
  name = "crossfeed-${var.stage}-es-application"
  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

resource "aws_ssm_parameter" "es_endpoint" {
  name      = "/crossfeed/${var.stage}/ELASTICSEARCH_ENDPOINT"
  type      = "String"
  value     = aws_elasticsearch_domain.es.endpoint
  overwrite = true

  tags = {
    Project = var.project
  }
}