resource "aws_cloudwatch_metric_alarm" "root_user" {
  alarm_name          = "${var.log_metric_root_user}-alarm"
  metric_name         = var.log_metric_root_user
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${var.log_metric_api_error_rate}-alarm"
  alarm_description   = "API error rate exceeded 5%"
  metric_name         = "5XXError"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  period              = 60
  evaluation_periods  = 2
  threshold           = 0.05
  statistic           = "Average"
  unit                = "Count"
  treat_missing_data  = "notBreaching"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_medium
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_call" {
  alarm_name          = "${var.log_metric_unauthorized_api_call}-alarm"
  metric_name         = var.log_metric_unauthorized_api_call
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_low
  }
}

resource "aws_cloudwatch_metric_alarm" "login_without_mfa" {
  alarm_name          = "${var.log_metric_login_without_mfa}-alarm"
  metric_name         = var.log_metric_login_without_mfa
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy" {
  alarm_name          = "${var.log_metric_iam_policy}-alarm"
  metric_name         = var.log_metric_iam_policy
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudtrail" {
  alarm_name          = "${var.log_metric_cloudtrail}-alarm"
  metric_name         = var.log_metric_cloudtrail
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "login_failure" {
  alarm_name          = "${var.log_metric_login_failure}-alarm"
  metric_name         = var.log_metric_login_failure
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_low
  }
}

resource "aws_cloudwatch_metric_alarm" "cmk_delete_disable" {
  alarm_name          = "${var.log_metric_cmk_delete_disable}-alarm"
  metric_name         = var.log_metric_cmk_delete_disable
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_policy" {
  alarm_name          = "${var.log_metric_s3_bucket_policy}-alarm"
  metric_name         = var.log_metric_s3_bucket_policy
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "aws_config" {
  alarm_name          = "${var.log_metric_aws_config}-alarm"
  metric_name         = var.log_metric_aws_config
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "security_group" {
  alarm_name          = "${var.log_metric_security_group}-alarm"
  metric_name         = var.log_metric_security_group
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "nacl" {
  alarm_name          = "${var.log_metric_nacl}-alarm"
  metric_name         = var.log_metric_nacl
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "network_gateway" {
  alarm_name          = "${var.log_metric_network_gateway}-alarm"
  metric_name         = var.log_metric_network_gateway
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "route_table" {
  alarm_name          = "${var.log_metric_route_table}-alarm"
  metric_name         = var.log_metric_route_table
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc" {
  alarm_name          = "${var.log_metric_vpc}-alarm"
  metric_name         = var.log_metric_vpc
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_shutdown" {
  alarm_name          = "${var.log_metric_ec2_shutdown}-alarm"
  metric_name         = var.log_metric_ec2_shutdown
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "db_shutdown" {
  alarm_name          = "${var.log_metric_db_shutdown}-alarm"
  metric_name         = var.log_metric_db_shutdown
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "db_deletion" {
  alarm_name          = "${var.log_metric_db_deletion}-alarm"
  metric_name         = var.log_metric_db_deletion
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}