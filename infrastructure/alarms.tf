resource "aws_cloudwatch_log_metric_filter" "cloudwatch1" {
  log_group_name = var.cloudtrail_log_group_name
  name           = "RootUserAccess"
  pattern        = "{$.userIdentity.type='Root' && $.userIdentity.invokedBy NOT EXISTS && $.eventType !='AwsServiceEvent'}"
  default_value  = 0
  value          = 1
}
resource "aws_cloudwatch_metric_alarm" "cloudwatch1" {
  alarm_name          = aws_cloudwatch_log_metric_filter.cloudwatch1.name
  metric_name         = aws_cloudwatch_log_metric_filter.cloudwatch1.name
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 0
  threshold           = 1
}