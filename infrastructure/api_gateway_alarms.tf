resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${var.log_metric_api_error_rate}-alarm"
  alarm_description   = "The percentage of API calls returning a 5xx error exceeds 5%"
  metric_name         = "5XXError"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  period              = 60
  evaluation_periods  = 2
  threshold           = 0.05
  statistic           = "Average"
  unit                = "Count"
  treat_missing_data  = "notBreaching"
  namespace           = var.log_metric_namespace

  tags = {
    Project  = var.project
    Stage    = var.stage
    Severity = var.severity_medium
  }
}

