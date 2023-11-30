resource "aws_sns_topic" "alarms" {
  name              = var.sns_topic_alarms
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}
