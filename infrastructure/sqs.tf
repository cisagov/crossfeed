
# SQS Queue
resource "aws_sqs_queue" "terraform_queue" {
  name                      = var.sqs_queue_name
  delay_seconds             = 90
  max_message_size          = 262144
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 10

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ssm_parameter" "sqs_queue_arn" {
  name        = var.ssm_sqs_queue_arn
  description = "ARN of the SQS queue"
  type        = "String"
  value       = aws_sqs_queue.terraform_queue.arn
}