# https://github.com/wikitribune/matomo/tree/master/aws-ecs


resource "aws_ecs_cluster" "matomo" {
  name               = var.matomo_ecs_cluster_name
  capacity_providers = ["FARGATE"]

  tags = {
    Project = var.project
    Stage   = var.stage
  }
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
        "name": "MATOMO_DATABASE_PASSWORD",
        "value": "${aws_db_instance.matomo_db.password}"
      },
      {
        "name": "MATOMO_DATABASE_DBNAME",
        "value": "${aws_db_instance.matomo_db.name}"
      }
    ]
  }
]
  EOF
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256 # .25 vCPU
  memory = 512 # 512 MB

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

# resource "aws_ecs_service" "matomo" {
#   name            = "matomo"
#   cluster         = aws_ecs_cluster.foo.id
#   task_definition = aws_ecs_task_definition.mongo.arn
#   desired_count   = 3
#   iam_role        = aws_iam_role.foo.arn
#   depends_on      = [aws_iam_role_policy.foo]

#   ordered_placement_strategy {
#     type  = "binpack"
#     field = "cpu"
#   }

#   load_balancer {
#     target_group_arn = aws_lb_target_group.foo.arn
#     container_name   = "mongo"
#     container_port   = 8080
#   }

#   placement_constraints {
#     type       = "memberOf"
#     expression = "attribute:ecs.availability-zone in [us-west-2a, us-west-2b]"
#   }
# }

resource "aws_cloudwatch_log_group" "matomo" {
  name = var.matomo_ecs_log_group_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "random_password" "matomo_db_password" {
  length = 16
  special = false
}

resource "aws_db_instance" "matomo_db" {
  identifier              = var.matomo_db_name
  instance_class          = var.matomo_db_instance_class
  allocated_storage       = 20
  max_allocated_storage   = 1000
  storage_type            = "gp2"
  engine                  = "mariadb"
  engine_version          = "10.4"
  skip_final_snapshot     = true
  availability_zone       = data.aws_availability_zones.available.names[0]
  multi_az                = false
  backup_retention_period = 35
  storage_encrypted       = true

  // database information
  name     = "matomo"
  username = "matomo"
  password = random_password.matomo_db_password.result

  db_subnet_group_name = aws_db_subnet_group.default.name

  vpc_security_group_ids = [aws_security_group.allow_internal.id]

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}