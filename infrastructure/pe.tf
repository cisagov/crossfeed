// PE database

resource "aws_db_instance" "pe_db" {
  identifier                          = var.pe_db_name
  instance_class                      = var.db_instance_class
  allocated_storage                   = 1000
  max_allocated_storage               = 10000
  storage_type                        = "gp2"
  engine                              = "postgres"
  engine_version                      = "14.4"
  allow_major_version_upgrade         = true
  skip_final_snapshot                 = true
  availability_zone                   = data.aws_availability_zones.available.names[0]
  multi_az                            = false
  backup_retention_period             = 35
  storage_encrypted                   = true
  iam_database_authentication_enabled = true
  enabled_cloudwatch_logs_exports     = ["postgresql", "upgrade"]

  // database information
  db_name  = var.pe_db_table_name
  username = data.aws_ssm_parameter.pe_db_username.value
  password = data.aws_ssm_parameter.pe_db_password.value
  port     = var.db_port

  db_subnet_group_name = aws_db_subnet_group.default.name

  vpc_security_group_ids = [aws_security_group.allow_internal.id]

  tags = {
    Project = "Crossfeed"
  }
}

// DB Accessor
resource "aws_instance" "db_accessor" {
  count                       = var.create_db_accessor_instance ? 1 : 0
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.db_accessor_instance_class
  associate_public_ip_address = false

  tags = {
    Project = var.project
    Stage   = var.stage
  }
  root_block_device {
    volume_size = 1000
  }

  vpc_security_group_ids = [aws_security_group.allow_internal.id]
  subnet_id              = aws_subnet.backend.id

  iam_instance_profile = aws_iam_instance_profile.db_accessor.id
  user_data            = file("./ssm-agent-install.sh")

  lifecycle {
    # prevent_destroy = true
    ignore_changes = [ami]
  }
}

resource "aws_iam_role" "db_accessor" {
  name               = "crossfeed-db-accessor-${var.stage}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

#Instance Profile
resource "aws_iam_instance_profile" "db_accessor" {
  name = "crossfeed-db-accessor-${var.stage}"
  role = aws_iam_role.db_accessor.id
}

#Attach Policies to Instance Role
resource "aws_iam_policy_attachment" "db_accessor_1" {
  name       = "crossfeed-db-accessor-${var.stage}"
  roles      = [aws_iam_role.db_accessor.id]
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_policy_attachment" "db_accessor_2" {
  name       = "crossfeed-db-accessor-${var.stage}"
  roles      = [aws_iam_role.db_accessor.id]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

resource "aws_iam_role_policy" "db_accessor_s3_policy" {
  name_prefix = "crossfeed-db-accessor-s3-${var.stage}"
  role        = aws_iam_role.db_accessor.id
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "${aws_s3_bucket.reports_bucket.arn}",
        "${aws_s3_bucket.reports_bucket.arn}/*",
        "${aws_s3_bucket.pe_db_backups_bucket.arn}",
        "${aws_s3_bucket.pe_db_backups_bucket.arn}/*",
        "${aws_s3_bucket.pe_reports_bucket.arn}",
        "${aws_s3_bucket.pe_reports_bucket.arn}/*",
        "${aws_s3_bucket.pe_asmsheets_bucket.arn}",
        "${aws_s3_bucket.pe_asmsheets_bucket.arn}/*",
        "${aws_s3_bucket.pe_test_bucket.arn}",
        "${aws_s3_bucket.pe_test_bucket.arn}/*",
        "${aws_s3_bucket.pe_scorecards_bucket.arn}",
        "${aws_s3_bucket.pe_scorecards_bucket.arn}/*"
      ]
    }
  ]
}
EOF
}


// PE Reports S3 Bucket
resource "aws_s3_bucket" "pe_reports_bucket" {
  bucket = var.pe_reports_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_reports_bucket" {
  bucket = aws_s3_bucket.pe_reports_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_reports_bucket" {
  bucket        = aws_s3_bucket.pe_reports_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "pe_reports_bucket/"
}

// PE Scorecards S3 Bucket
resource "aws_s3_bucket" "pe_scorecards_bucket" {
  bucket = var.pe_scorecards_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_scorecards_bucket" {
  bucket = aws_s3_bucket.pe_scorecards_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_scorecards_bucket" {
  bucket = aws_s3_bucket.pe_scorecards_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_scorecards_bucket" {
  bucket = aws_s3_bucket.pe_scorecards_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_scorecards_bucket" {
  bucket        = aws_s3_bucket.pe_scorecards_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "pe_scorecards_bucket/"
}

// PE ASM Sheets S3 Bucket
resource "aws_s3_bucket" "pe_asmsheets_bucket" {
  bucket = var.pe_asmsheets_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_asmsheets_bucket" {
  bucket = aws_s3_bucket.pe_asmsheets_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_asmsheets_bucket" {
  bucket = aws_s3_bucket.pe_asmsheets_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_asmsheets_bucket" {
  bucket = aws_s3_bucket.pe_asmsheets_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_asmsheets_bucket" {
  bucket        = aws_s3_bucket.pe_asmsheets_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "pe_asmsheets_bucket/"
}

// PE Test S3 Bucket
resource "aws_s3_bucket" "pe_test_bucket" {
  bucket = var.pe_test_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_acl" "pe_test_bucket" {
  bucket = aws_s3_bucket.pe_test_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_test_bucket" {
  bucket = aws_s3_bucket.pe_test_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_test_bucket" {
  bucket = aws_s3_bucket.pe_test_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_test_bucket" {
  bucket        = aws_s3_bucket.pe_test_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "pe_test_bucket/"
}



resource "aws_cloudwatch_event_rule" "scheduled_pe_task" {

  name                = "scheduled-pe-event-rule"
  schedule_expression = "cron(0 0 1,16 * ? *)"
}

resource "aws_cloudwatch_event_rule" "scheduled_pe_cybersixgill_task" {

  name                = "scheduled-pe-event-cybersixgill-rule"
  schedule_expression = "cron(0 0 1,16 * ? *)"
}

resource "aws_iam_role" "cloudwatch_scheduled_task_execution" {
  name               = "crossfeed-pe-cloudwatch-role-${var.stage}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_iam_role_policy" "scheduled_task_cloudwatch_policy" {
  name   = "crossfeed-pe-cloudwatch-policy-${var.stage}"
  role   = aws_iam_role.cloudwatch_scheduled_task_execution.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:RunTask"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_shodan_task" {
  target_id = "scheduled-ecs-target-shodan"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeShodan.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_intelx_task" {
  target_id = "scheduled-ecs-target-intelx"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeIntelx.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_hibp_task" {
  target_id = "scheduled-ecs-target-hibp"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeHibp.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_dnstwist_task" {
  target_id = "scheduled-ecs-target-dnstwist"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeDnstwist.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_dnsmonitor_task" {
  target_id = "scheduled-ecs-target-dnsmonitor"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeDnsMonitor.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_alerts_task" {
  target_id = "scheduled-ecs-target-alerts"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_cybersixgill_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeAlerts.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_mentions_task" {
  target_id = "scheduled-ecs-target-mentions"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_cybersixgill_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeMentions.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_credentials_task" {
  target_id = "scheduled-ecs-target-credentials"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_cybersixgill_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeCredentials.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_top_cves_task" {
  target_id = "scheduled-ecs-target-cves"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_cybersixgill_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.cloudwatch_scheduled_task_execution.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = ["$FARGATE_SUBNET_ID"]
      assign_public_ip = true
      security_groups  = ["$FARGATE_SG_ID"]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./worker/pe_scripts/runPeTopCVEs.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}