
# P&E ECR Repository
resource "aws_ecr_repository" "pe_worker" {
  name = var.pe_worker_ecs_repository_name
  image_scanning_configuration {
    scan_on_push = true
  }
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.key.arn
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

# P&E ECS Cluster
resource "aws_ecs_cluster" "pe_worker" {
  name = var.pe_worker_ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ecs_cluster_capacity_providers" "pe_worker" {
  cluster_name       = aws_ecs_cluster.pe_worker.name
  capacity_providers = ["FARGATE"]
}

# P&E Task Definition
resource "aws_ecs_task_definition" "pe_worker" {
  family                   = var.pe_worker_ecs_task_definition_family
  container_definitions    = <<EOF
[
  {
    "name": "main",
    "image": "${aws_ecr_repository.pe_worker.repository_url}:latest",
    "essential": true,
    "mountPoints": [],
    "portMappings": [],
    "volumesFrom": [],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
          "awslogs-group": "${var.pe_worker_ecs_log_group_name}",
          "awslogs-region": "${var.aws_region}",
          "awslogs-stream-prefix": "worker"
      }
    },
    "environment": [
      {
        "name": "DB_DIALECT",
        "value": "postgres"
      },
      {
        "name": "DB_PORT",
        "value": "${var.db_port}"
      }
    ],
    "secrets": [
      {
        "name": "DB_HOST",
        "valueFrom": "${aws_ssm_parameter.crossfeed_send_db_host.arn}"
      },
      {
        "name": "DB_NAME",
        "valueFrom": "${aws_ssm_parameter.crossfeed_send_db_name.arn}"
      },
      {
        "name": "DB_USERNAME",
        "valueFrom": "${data.aws_ssm_parameter.db_username.arn}"
      },
      {
        "name": "DB_PASSWORD",
        "valueFrom": "${data.aws_ssm_parameter.db_password.arn}"
      },
      {
        "name": "PE_DB_NAME",
        "valueFrom": "${data.aws_ssm_parameter.pe_db_name.arn}"
      },
      {
        "name": "PE_DB_USERNAME",
        "valueFrom": "${data.aws_ssm_parameter.pe_db_username.arn}"
      },
      {
        "name": "PE_DB_PASSWORD",
        "valueFrom": "${data.aws_ssm_parameter.pe_db_password.arn}"
      },
      {
        "name": "CENSYS_API_ID",
        "valueFrom": "${data.aws_ssm_parameter.censys_api_id.arn}"
      },
      {
        "name": "CENSYS_API_SECRET",
        "valueFrom": "${data.aws_ssm_parameter.censys_api_secret.arn}"
      },
      {
        "name": "SHODAN_API_KEY",
        "valueFrom": "${data.aws_ssm_parameter.shodan_api_key.arn}"
      },
      {
        "name": "HIBP_API_KEY",
        "valueFrom": "${data.aws_ssm_parameter.hibp_api_key.arn}"
      },
      {
        "name": "PE_SHODAN_API_KEYS",
        "valueFrom": "${data.aws_ssm_parameter.pe_shodan_api_keys.arn}"
      },
      {
        "name": "SIXGILL_CLIENT_ID",
        "valueFrom": "${data.aws_ssm_parameter.sixgill_client_id.arn}"
      },
      {
        "name": "SIXGILL_CLIENT_SECRET",
        "valueFrom": "${data.aws_ssm_parameter.sixgill_client_secret.arn}"
      },
      {
        "name": "LG_API_KEY",
        "valueFrom": "${data.aws_ssm_parameter.lg_api_key.arn}"
      },
      {
        "name": "LG_WORKSPACE_NAME",
        "valueFrom": "${data.aws_ssm_parameter.lg_workspace_name.arn}"
      },
      {
        "name": "WORKER_SIGNATURE_PUBLIC_KEY",
        "valueFrom": "${data.aws_ssm_parameter.worker_signature_public_key.arn}"
      },
      {
        "name": "WORKER_SIGNATURE_PRIVATE_KEY",
        "valueFrom": "${data.aws_ssm_parameter.worker_signature_private_key.arn}"
      },
      {
        "name": "ELASTICSEARCH_ENDPOINT",
        "valueFrom": "${aws_ssm_parameter.es_endpoint.arn}"
      },
      {
        "name": "SHODAN_QUEUE_URL",
        "valueFrom": "${data.aws_ssm_parameter.shodan_queue_url.arn}"
      }
    ]
  }
]
  EOF
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.worker_task_execution_role.arn
  task_role_arn            = aws_iam_role.worker_task_role.arn

  # CPU and memory values: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html

  cpu    = 256 # .25 vCPU
  memory = 512 # 512 MB

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

# Shodan specific ECS service
resource "aws_ecs_service" "shodan_service" {
  name            = var.pe_shodan_ecs_service_name
  cluster         = aws_ecs_cluster.pe_worker.id
  task_definition = aws_ecs_task_definition.pe_worker.arn
  launch_type     = "FARGATE"
  desired_count   = 0 # Initially set to 0, plan to start it dynamically
  network_configuration {
    subnets         = aws_subnet.worker.*.id
    security_groups = [aws_security_group.worker.id]
  }
}