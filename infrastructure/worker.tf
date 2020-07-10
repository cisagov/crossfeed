resource "aws_ecr_repository" "worker" {
  name                = var.worker_ecs_repository_name
  image_scanning_configuration {
    scan_on_push = true
  }
}

data "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
}

resource "aws_ecs_cluster" "worker" {
  name = var.worker_ecs_cluster_name
  capacity_providers = ["FARGATE"]
}

resource "aws_ecs_task_definition" "worker" {
  family                = var.worker_ecs_task_definition_family
  container_definitions = <<EOF
[
  {
    "name": "main",
    "image": "${aws_ecr_repository.worker.repository_url}:latest",
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
          "awslogs-group": "${var.worker_ecs_log_group_name}",
          "awslogs-region": "${var.aws_region}",
          "awslogs-stream-prefix": "worker"
      }
    }
  }
]
  EOF
  requires_compatibilities = ["FARGATE"]
  network_mode          = "awsvpc"
  execution_role_arn       = data.aws_iam_role.ecs_task_execution_role.arn

  # TODO: add these in the container definition for database credentials:
  #   "secrets": [
  #   {
  #       "name": "environment_variable_name",
  #       "valueFrom": "arn:aws:ssm:region:aws_account_id:parameter/parameter_name"
  #   }
  # ]

  # CPU and memory values: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
  
  cpu = 256 # .25 vCPU
  memory = 512 # 512 MB
}

resource "aws_cloudwatch_log_group" "worker" {
  name = var.worker_ecs_log_group_name # should match awslogs-group in service.json
}

