
resource "aws_cloudwatch_event_rule" "scheduled_pe_task" {

  name                = "scheduled-pe-event-rule"
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

resource "aws_cloudwatch_event_target" "scheduled_pe_top_cves_task" {
  target_id = "scheduled-ecs-target-cves"
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
      "command": "./worker/pe_scripts/runPeTopCVEs.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_mentions_task" {
  target_id = "scheduled-ecs-target-mentions"
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
      "command": "./worker/pe_scripts/runPeMentions.sh",
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

resource "aws_cloudwatch_event_target" "scheduled_pe_credentials_task" {
  target_id = "scheduled-ecs-target-credentials"
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
      "command": "./worker/pe_scripts/runPeCredentials.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_alerts_task" {
  target_id = "scheduled-ecs-target-alerts"
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
      "command": "./worker/pe_scripts/runPeAlerts.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}
