resource "aws_ecr_repository" "worker" {
  name = var.worker_ecs_repository_name
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

resource "aws_iam_role" "worker_task_execution_role" {
  name               = var.worker_ecs_role_name
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
  role        = aws_iam_role.worker_task_execution_role.id

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
          "${data.aws_ssm_parameter.pe_db_name.arn}",
          "${data.aws_ssm_parameter.pe_db_username.arn}",
          "${data.aws_ssm_parameter.pe_db_password.arn}",
          "${data.aws_ssm_parameter.worker_signature_public_key.arn}",
          "${data.aws_ssm_parameter.worker_signature_private_key.arn}",
          "${data.aws_ssm_parameter.censys_api_id.arn}",
          "${data.aws_ssm_parameter.censys_api_secret.arn}",
          "${data.aws_ssm_parameter.shodan_api_key.arn}",
          "${data.aws_ssm_parameter.hibp_api_key.arn}",
          "${data.aws_ssm_parameter.pe_shodan_api_keys.arn}",
          "${data.aws_ssm_parameter.sixgill_client_id.arn}",
          "${data.aws_ssm_parameter.sixgill_client_secret.arn}",
          "${data.aws_ssm_parameter.lg_api_key.arn}",
          "${data.aws_ssm_parameter.lg_workspace_name.arn}",
          "${aws_ssm_parameter.es_endpoint.arn}"
        ]
    }
  ]
}
EOF
}

resource "aws_iam_role" "worker_task_role" {
  name               = "crossfeed-${var.stage}-worker-task"
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

resource "aws_iam_role_policy" "worker_task_role_policy" {
  name_prefix = aws_iam_role.worker_task_role.name
  role        = aws_iam_role.worker_task_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Effect": "Allow",
        "Action": [
            "s3:PutObject",
            "s3:PutObjectAcl",
            "s3:GetObject",
            "s3:GetObjectAcl"
        ],
        "Resource": [
          "${aws_s3_bucket.export_bucket.arn}/*"
        ]
    },
    {
      "Effect": "Allow",
      "Action": [
          "s3:ListBucket"
      ],
      "Resource": [
        "${aws_s3_bucket.export_bucket.arn}"
      ]
    }
  ]
}
EOF
}

resource "aws_ecs_cluster" "worker" {
  name = var.worker_ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_ecs_cluster_capacity_providers" "worker" {
  cluster_name       = aws_ecs_cluster.worker.name
  capacity_providers = ["FARGATE"]
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
  family                   = var.worker_ecs_task_definition_family
  container_definitions    = <<EOF
[
  {
    "name": "main",
    "image": "${aws_ecr_repository.worker.repository_url}:latest",
    "essential": true,
    "mountPoints": [],
    "portMappings": [],
    "volumesFrom": [],
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

resource "aws_cloudwatch_log_group" "worker" {
  name              = var.worker_ecs_log_group_name # should match awslogs-group in service.json
  retention_in_days = 3653
  kms_key_id        = aws_kms_key.key.arn
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

data "aws_ssm_parameter" "censys_api_id" { name = var.ssm_censys_api_id }

data "aws_ssm_parameter" "censys_api_secret" { name = var.ssm_censys_api_secret }

data "aws_ssm_parameter" "shodan_api_key" { name = var.ssm_shodan_api_key }

data "aws_ssm_parameter" "hibp_api_key" { name = var.ssm_hibp_api_key }

data "aws_ssm_parameter" "pe_shodan_api_keys" { name = var.ssm_pe_shodan_api_keys }

data "aws_ssm_parameter" "sixgill_client_id" { name = var.ssm_sixgill_client_id }

data "aws_ssm_parameter" "sixgill_client_secret" { name = var.ssm_sixgill_client_secret }

data "aws_ssm_parameter" "pe_db_name" { name = var.ssm_pe_db_name }

data "aws_ssm_parameter" "pe_db_username" { name = var.ssm_pe_db_username }

data "aws_ssm_parameter" "pe_db_password" { name = var.ssm_pe_db_password }

data "aws_ssm_parameter" "lg_api_key" { name = var.ssm_lg_api_key }

data "aws_ssm_parameter" "lg_workspace_name" { name = var.ssm_lg_workspace_name }

data "aws_ssm_parameter" "worker_signature_public_key" { name = var.ssm_worker_signature_public_key }

data "aws_ssm_parameter" "worker_signature_private_key" { name = var.ssm_worker_signature_private_key }

resource "aws_s3_bucket" "export_bucket" {
  bucket = var.export_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "export_bucket" {
  bucket = aws_s3_bucket.export_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "export_bucket" {
  bucket = aws_s3_bucket.export_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "export_bucket" {
  bucket = aws_s3_bucket.export_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "export_bucket" {
  bucket        = aws_s3_bucket.export_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "export_bucket/"
}

resource "aws_s3_bucket_lifecycle_configuration" "export_bucket" {
  bucket = aws_s3_bucket.export_bucket.id
  rule {
    id     = "all_files"
    status = "Enabled"
    expiration {
      days = 1
    }
  }
}
