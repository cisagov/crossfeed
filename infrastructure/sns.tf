resource "aws_sns_topic" "alarms" {
  name = var.sns_topic_alarms

  tags = {
    project = var.project
    stage   = var.stage
  }
}
