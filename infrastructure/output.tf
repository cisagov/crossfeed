output "worker_ecs_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

output "db_accessor_instance_id" {
  value = aws_instance.db_accessor[0].id
}

output "db_accessor_private_key" {
  value     = tls_private_key.db_accessor.private_key_pem
  sensitive = true
}
