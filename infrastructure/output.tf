output "worker_ecs_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

# output "db_accessor_instance_id" {
#   value = try(aws_instance.db_accessor[0].id, null)
# }
