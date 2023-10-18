resource "aws_sns_topic" "alarms" {
  name = var.sns_topic_alarms
}

resource "aws_sns_topic_subscription" "alarms" {
  endpoint  = aws_sqs_queue.alarms.arn
  protocol  = "sqs"
  topic_arn = aws_sns_topic.alarms
}

resource "aws_sns_topic_policy" "alarms" {
  arn    = aws_sns_topic.alarms.arn
  policy = jsonencode({
    version = "2012-10-17"

  })
}