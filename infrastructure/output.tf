output "worker_ecs_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

output "db_bastion_instance_id" {
  description = "Instance ID of the bastion instance that is used to access the database."
  value       = aws_instance.db_bastion.id
}

output "db_url" {
  description = "Database URL."
  value       = aws_instance.db_bastion.id
}
