resource "aws_cloudwatch_metric_alarm" "root_user" {
  alarm_name          = "${var.log_metric_root_user}-alarm"
  alarm_description   = "The root user account signed into AWS"
  metric_name         = var.log_metric_root_user
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_call" {
  alarm_name          = "${var.log_metric_unauthorized_api_call}-alarm"
  alarm_description   = "An API call returned an unauthorized error"
  metric_name         = var.log_metric_unauthorized_api_call
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_low
  }
}

resource "aws_cloudwatch_metric_alarm" "login_without_mfa" {
  alarm_name          = "${var.log_metric_login_without_mfa}-alarm"
  alarm_description   = "A user logged into AWS without MFA"
  metric_name         = var.log_metric_login_without_mfa
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy" {
  alarm_name          = "${var.log_metric_iam_policy}-alarm"
  alarm_description   = "An IAM policy was modified"
  metric_name         = var.log_metric_iam_policy
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudtrail" {
  alarm_name          = "${var.log_metric_cloudtrail}-alarm"
  alarm_description   = "CloudTrail configurations were modified"
  metric_name         = var.log_metric_cloudtrail
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "login_failure" {
  alarm_name          = "${var.log_metric_login_failure}-alarm"
  alarm_description   = "A user sign in to AWS failed"
  metric_name         = var.log_metric_login_failure
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_low
  }
}

resource "aws_cloudwatch_metric_alarm" "cmk_delete_disable" {
  alarm_name          = "${var.log_metric_cmk_delete_disable}-alarm"
  alarm_description   = "A customer-managed key was disabled or scheduled for deletion"
  metric_name         = var.log_metric_cmk_delete_disable
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_policy" {
  alarm_name          = "${var.log_metric_s3_bucket_policy}-alarm"
  alarm_description   = "An S3 bucket policy was modified"
  metric_name         = var.log_metric_s3_bucket_policy
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "aws_config" {
  alarm_name          = "${var.log_metric_aws_config}-alarm"
  alarm_description   = "AWS Config was modified"
  metric_name         = var.log_metric_aws_config
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "security_group" {
  alarm_name          = "${var.log_metric_security_group}-alarm"
  alarm_description   = "A security group was modified"
  metric_name         = var.log_metric_security_group
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "nacl" {
  alarm_name          = "${var.log_metric_nacl}-alarm"
  alarm_description   = "A network ACL was modified"
  metric_name         = var.log_metric_nacl
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "network_gateway" {
  alarm_name          = "${var.log_metric_network_gateway}-alarm"
  alarm_description   = "A network gateway was modified"
  metric_name         = var.log_metric_network_gateway
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "route_table" {
  alarm_name          = "${var.log_metric_route_table}-alarm"
  alarm_description   = "A route table was modified"
  metric_name         = var.log_metric_route_table
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

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
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_high
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_shutdown" {
  alarm_name          = "${var.log_metric_ec2_shutdown}-alarm"
  alarm_description   = "An EC2 instance was shut down"
  metric_name         = var.log_metric_ec2_shutdown
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "db_shutdown" {
  alarm_name          = "${var.log_metric_db_shutdown}-alarm"
  alarm_description   = "An RDS instance was shut down"
  metric_name         = var.log_metric_db_shutdown
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}

resource "aws_cloudwatch_metric_alarm" "db_deletion" {
  alarm_name          = "${var.log_metric_db_deletion}-alarm"
  alarm_description   = "An RDS instance was deleted"
  metric_name         = var.log_metric_db_deletion
  namespace           = var.log_metric_namespace
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 60
  threshold           = 1
  statistic           = "Sum"

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_critical
  }
}