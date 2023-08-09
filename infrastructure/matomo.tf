resource "aws_ecs_cluster" "matomo" {
  name = var.matomo_ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ecs_cluster_capacity_providers" "motomo" {
  cluster_name       = aws_ecs_cluster.matomo.name
  capacity_providers = ["FARGATE"]
}

resource "aws_iam_role" "matomo_task_execution_role" {
  name               = var.matomo_ecs_role_name
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

resource "aws_iam_role_policy" "matomo_task_execution_role_policy" {
  name_prefix = var.matomo_ecs_role_name
  role        = aws_iam_role.matomo_task_execution_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_ecs_task_definition" "matomo" {
  family                   = var.matomo_ecs_task_definition_family
  container_definitions    = <<EOF
[
  {
    "name": "main",
    "image": "matomo:3.14.1",
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
          "awslogs-group": "${var.matomo_ecs_log_group_name}",
          "awslogs-region": "${var.aws_region}",
          "awslogs-stream-prefix": "matomo"
      }
    },
    "environment": [
      {
        "name": "MATOMO_DATABASE_HOST",
        "value": "${aws_db_instance.matomo_db.address}"
      },
      {
        "name": "MATOMO_DATABASE_ADAPTER",
        "value": "mysql"
      },
      {
        "name": "MATOMO_DATABASE_TABLES_PREFIX",
        "value": "matomo_"
      },
      {
        "name": "MATOMO_DATABASE_USERNAME",
        "value": "${aws_db_instance.matomo_db.username}"
      },
      {
        "name": "MATOMO_DATABASE_DBNAME",
        "value": "${aws_db_instance.matomo_db.name}"
      },
      {
        "name": "MATOMO_GENERAL_PROXY_URI_HEADER",
        "value": "1"
      },
      {
        "name": "MATOMO_GENERAL_ASSUME_SECURE_PROTOCOL",
        "value": "1"
      }
    ],
    "secrets": [
      {
        "name": "MATOMO_DATABASE_PASSWORD",
        "valueFrom": "${aws_ssm_parameter.matomo_db_password.arn}"
      }
    ]
  }
]
  EOF
  execution_role_arn       = aws_iam_role.matomo_task_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256 # .25 vCPU
  memory = 512 # 512 MB

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_service_discovery_private_dns_namespace" "default" {
  name        = "crossfeed.local"
  description = "Crossfeed ${var.stage}"
  vpc         = aws_vpc.crossfeed_vpc.id
}

resource "aws_service_discovery_service" "matomo" {
  # ECS service can be accessed through http://matomo.crossfeed.local
  name = "matomo"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.default.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }
}

resource "aws_ecs_service" "matomo" {
  name            = "matomo"
  launch_type     = "FARGATE"
  cluster         = aws_ecs_cluster.matomo.id
  task_definition = aws_ecs_task_definition.matomo.arn
  desired_count   = 1
  network_configuration {
    subnets         = [aws_subnet.matomo_1.id]
    security_groups = [aws_security_group.allow_internal.id]
  }
  service_registries {
    registry_arn = aws_service_discovery_service.matomo.arn
  }
}

resource "aws_cloudwatch_log_group" "matomo" {
  name              = var.matomo_ecs_log_group_name
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "random_password" "matomo_db_password" {
  length  = 16
  special = false
}

resource "aws_db_instance" "matomo_db" {
  identifier                          = var.matomo_db_name
  instance_class                      = var.matomo_db_instance_class
  allocated_storage                   = 20
  max_allocated_storage               = 1000
  storage_type                        = "gp2"
  engine                              = "mariadb"
  engine_version                      = "10.6"
  skip_final_snapshot                 = true
  availability_zone                   = data.aws_availability_zones.available.names[0]
  multi_az                            = false
  backup_retention_period             = 35
  storage_encrypted                   = true
  iam_database_authentication_enabled = false
  allow_major_version_upgrade         = true

  // database information
  db_name  = "matomo"
  username = "matomo"
  password = random_password.matomo_db_password.result

  db_subnet_group_name = aws_db_subnet_group.default.name

  vpc_security_group_ids = [aws_security_group.allow_internal.id]

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ssm_parameter" "matomo_db_password" {
  name      = var.ssm_matomo_db_password
  type      = "SecureString"
  value     = random_password.matomo_db_password.result
  overwrite = true

  tags = {
    Project = var.project
  }
}
