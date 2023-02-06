
resource "aws_cloudwatch_event_rule" "scheduled_pe_task" {

  name                = "scheduled-pe-event-rule"
  schedule_expression = "cron(0 5 1,16 * *)"
}

resource "aws_cloudwatch_event_target" "scheduled_pe_shodan_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeShodan.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_top_cves_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeTopCVEs.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_mentions_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeMentions.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_intelx_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeIntelx.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_hibp_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeHibp.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_dnstwist_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeDnstwist.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_dnsmonitor_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeDnsMonitor.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_credentials_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeCredentials.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_event_target" "scheduled_pe_alerts_task" {
  target_id = "$scheduled-ecs-target"
  rule      = aws_cloudwatch_event_rule.scheduled_pe_task.name
  arn       = aws_ecs_cluster.worker.arn
  role_arn  = aws_iam_role.scheduled_task_cloudwatch.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.worker.arn
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = data.aws_subnet_ids.subnets.ids
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs.id]
    }
  }
  input = <<EOF
{
  "containerOverrides": [
    {
      "name": "main",
      "command": "./backend/worker/pe_scripts/runPeAlerts.sh",
      "cpu": "2048",
      "memory": "16384"
    }
  ]
}
EOF
}