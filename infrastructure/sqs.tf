resource "aws_sqs_queue" "alarms" {
  name                        = var.sqs_queue_alarms
  fifo_queue                  = true
  content_based_deduplication = true
}