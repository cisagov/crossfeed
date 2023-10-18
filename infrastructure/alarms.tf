resource "aws_cloudwatch_log_metric_filter" "cloudwatch1" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_filter_cloudwatch1
  pattern        = "{$.userIdentity.type=\"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType !=\"AwsServiceEvent\"}"
  default_value  = 0
  value          = 1
}
resource "aws_cloudwatch_metric_alarm" "cloudwatch1" {
  alarm_name          = "${var.log_metric_filter_cloudwatch1}-alarm"
  metric_name         = var.log_metric_filter_cloudwatch1
  alarm_actions       = [aws_sns_topic.alarms.arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 0
  threshold           = 1
}