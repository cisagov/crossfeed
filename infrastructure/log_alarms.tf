resource "aws_cloudwatch_metric_alarm" "cloudwatch1" {
  alarm_name          = "${var.log_metric_name_cloudwatch1}-alarm"
  metric_name         = var.log_metric_name_cloudwatch1
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch2" {
  alarm_name          = "${var.log_metric_name_cloudwatch2}-alarm"
  metric_name         = var.log_metric_name_cloudwatch2
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch3" {
  alarm_name          = "${var.log_metric_name_cloudwatch3}-alarm"
  metric_name         = var.log_metric_name_cloudwatch3
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch4" {
  alarm_name          = "${var.log_metric_name_cloudwatch4}-alarm"
  metric_name         = var.log_metric_name_cloudwatch4
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch5" {
  alarm_name          = "${var.log_metric_name_cloudwatch5}-alarm"
  metric_name         = var.log_metric_name_cloudwatch5
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch6" {
  alarm_name          = "${var.log_metric_name_cloudwatch6}-alarm"
  metric_name         = var.log_metric_name_cloudwatch6
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch7" {
  alarm_name          = "${var.log_metric_name_cloudwatch7}-alarm"
  metric_name         = var.log_metric_name_cloudwatch7
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch8" {
  alarm_name          = "${var.log_metric_name_cloudwatch8}-alarm"
  metric_name         = var.log_metric_name_cloudwatch8
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch9" {
  alarm_name          = "${var.log_metric_name_cloudwatch9}-alarm"
  metric_name         = var.log_metric_name_cloudwatch9
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch10" {
  alarm_name          = "${var.log_metric_name_cloudwatch10}-alarm"
  metric_name         = var.log_metric_name_cloudwatch10
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch11" {
  alarm_name          = "${var.log_metric_name_cloudwatch11}-alarm"
  metric_name         = var.log_metric_name_cloudwatch11
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch12" {
  alarm_name          = "${var.log_metric_name_cloudwatch12}-alarm"
  metric_name         = var.log_metric_name_cloudwatch12
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch13" {
  alarm_name          = "${var.log_metric_name_cloudwatch13}-alarm"
  metric_name         = var.log_metric_name_cloudwatch13
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudwatch14" {
  alarm_name          = "${var.log_metric_name_cloudwatch14}-alarm"
  metric_name         = var.log_metric_name_cloudwatch14
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  statistic           = "SampleCount"

  tags = {
    project = var.project
    stage   = var.stage
  }
}