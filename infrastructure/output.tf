output "lambda_subnet_id" {
  value = aws_subnet.lambda_subnet.id
}

output "lambda_sg_id" {
  value = aws_security_group.allow_internal.id
}

output "worker_ecs_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}
