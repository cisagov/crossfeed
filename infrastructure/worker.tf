resource "aws_ecr_repository" "worker" {
  name                = var.worker_ecs_repository_name
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

resource "aws_iam_role" "worker_task_execution_role" {
  name = var.worker_ecs_role_name
  assume_role_policy = <<EOF
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
  EOF

  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

resource "aws_iam_role_policy" "worker_task_execution_role_policy" {
  name_prefix = var.worker_ecs_role_name
  role = aws_iam_role.worker_task_execution_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
        "Effect": "Allow",
        "Action": [
            "ssm:GetParameters"
        ],
        "Resource": [
          "${aws_ssm_parameter.crossfeed_send_db_host.arn}",
          "${aws_ssm_parameter.crossfeed_send_db_name.arn}",
          "${data.aws_ssm_parameter.db_username.arn}",
          "${data.aws_ssm_parameter.db_password.arn}",
          "${data.aws_ssm_parameter.worker_signature_public_key.arn}",
          "${data.aws_ssm_parameter.worker_signature_private_key.arn}",
          "${data.aws_ssm_parameter.censys_api_id.arn}",
          "${data.aws_ssm_parameter.censys_api_secret.arn}"
        ]
    }
  ]
}
EOF
}

resource "aws_ecs_cluster" "worker" {
  name = var.worker_ecs_cluster_name
  capacity_providers = ["FARGATE"]

  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

resource "aws_ssm_parameter" "worker_arn" {
  name      = var.ssm_worker_arn
  type      = "String"
  value     = aws_ecs_cluster.worker.arn
  overwrite = true

  tags = {
    Project = var.project
  }
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
        "name": "CENSYS_API_ID",
        "valueFrom": "${data.aws_ssm_parameter.censys_api_id.arn}"
      },
      {
        "name": "CENSYS_API_SECRET",
        "valueFrom": "${data.aws_ssm_parameter.censys_api_secret.arn}"
      },
      {
        "name": "WORKER_SIGNATURE_PUBLIC_KEY",
        "valueFrom": "${data.aws_ssm_parameter.worker_signature_public_key.arn}"
      },
      {
        "name": "WORKER_SIGNATURE_PRIVATE_KEY",
        "valueFrom": "${data.aws_ssm_parameter.worker_signature_private_key.arn}"
      }
    ]
  }
]
  EOF
  # TODO: ADD CENSYS_API_ID, CENSYS_API_SECRET
  requires_compatibilities = ["FARGATE"]
  network_mode          = "awsvpc"
  execution_role_arn       = aws_iam_role.worker_task_execution_role.arn

  # CPU and memory values: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
  
  cpu = 256 # .25 vCPU
  memory = 512 # 512 MB

  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name = var.worker_ecs_log_group_name # should match awslogs-group in service.json
  tags = {	
    Project = var.project	
    Stage   = var.stage
  }
}

data "aws_ssm_parameter" "censys_api_id" { name = var.ssm_censys_api_id }

data "aws_ssm_parameter" "censys_api_secret" { name = var.ssm_censys_api_secret }

data "aws_ssm_parameter" "worker_signature_public_key" { name = var.ssm_worker_signature_public_key }

data "aws_ssm_parameter" "worker_signature_private_key" { name = var.ssm_worker_signature_private_key }