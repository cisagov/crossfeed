resource "aws_cloudwatch_metric_alarm" "root_user" {
  alarm_name          = "${var.log_metric_root_user}-alarm"
  metric_name         = var.log_metric_root_user
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_call" {
  alarm_name          = "${var.log_metric_unauthorized_api_call}-alarm"
  metric_name         = var.log_metric_unauthorized_api_call
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "login_without_mfa" {
  alarm_name          = "${var.log_metric_login_without_mfa}-alarm"
  metric_name         = var.log_metric_login_without_mfa
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy" {
  alarm_name          = "${var.log_metric_iam_policy}-alarm"
  metric_name         = var.log_metric_iam_policy
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudtrail" {
  alarm_name          = "${var.log_metric_cloudtrail}-alarm"
  metric_name         = var.log_metric_cloudtrail
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "login_failure" {
  alarm_name          = "${var.log_metric_login_failure}-alarm"
  metric_name         = var.log_metric_login_failure
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cmk_delete_disable" {
  alarm_name          = "${var.log_metric_cmk_delete_disable}-alarm"
  metric_name         = var.log_metric_cmk_delete_disable
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_policy" {
  alarm_name          = "${var.log_metric_s3_bucket_policy}-alarm"
  metric_name         = var.log_metric_s3_bucket_policy
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "aws_config" {
  alarm_name          = "${var.log_metric_aws_config}-alarm"
  metric_name         = var.log_metric_aws_config
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "security_group" {
  alarm_name          = "${var.log_metric_security_group}-alarm"
  metric_name         = var.log_metric_security_group
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "nacl" {
  alarm_name          = "${var.log_metric_nacl}-alarm"
  metric_name         = var.log_metric_nacl
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "network_gateway" {
  alarm_name          = "${var.log_metric_network_gateway}-alarm"
  metric_name         = var.log_metric_network_gateway
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "route_table" {
  alarm_name          = "${var.log_metric_route_table}-alarm"
  metric_name         = var.log_metric_route_table
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc" {
  alarm_name          = "${var.log_metric_vpc}-alarm"
  metric_name         = var.log_metric_vpc
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "system_shutdown" {
  alarm_name          = "${var.log_metric_system_shutdown}-alarm"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}