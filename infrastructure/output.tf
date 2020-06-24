output "lambda_subnet_id" {
  value = aws_subnet.lambda_subnet.id
}

output "lambda_sg_id" {
  value = aws_security_group.allow_internal.id
}
