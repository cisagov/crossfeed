//This is intended to be used to create a ubuntu instance that will be used to start and mainain a ELK stack

resource "aws_instance" "elk_stack" {
  count                       = var.create_elk_instance ? 1 : 0
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.elk_instance_class
  associate_public_ip_address = false

  tags = {
    Name    = "${var.project}-${var.stage}-elk-stack"
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

data "aws_iam_policy_document" "elk_policy" {
  statement {
    effect = "Allow"
    actions = ["cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
      "ec2:DescribeInstances",
      "ec2:DescribeRegions",
      "logs:DescribeLogGroups",
      "logs:FilterLogEvents",
      "rds:DescribeDBInstances",
      "rds:ListTagsForResource",
      "sns:ListTopics",
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:ListQueues",
      "sqs:ReceiveMessage",
      "sts:AssumeRole",
      "sts:GetCallerIdentity",
    "tag:GetResources"]
    resources = ["*"]
  }
}

# Define IAM user
resource "aws_iam_user" "elk_integration_user" {
  name = "ELKIntegrationUser"
}

# Attach policy to the IAM user
resource "aws_iam_user_policy" "lb_ro" {
  name   = "test"
  user   = aws_iam_user.elk_integration_user.name
  policy = data.aws_iam_policy_document.elk_policy.json
}

