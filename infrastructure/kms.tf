resource "aws_kms_key" "key" {
  description             = "KMS key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}