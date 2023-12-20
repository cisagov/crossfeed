//This is intended to be used to create a ubuntu instance that will be used to start and mainain a ELK stack

resource "aws_instance" "elk_stack" {
  count                       = var.create_elk_instance ? 1 : 0
  ami                         = var.ami_id
  instance_type               = var.elk_instance_class
  associate_public_ip_address = false


  tags = {
    Name                = "ELK"
    Project             = var.project
    Stage               = var.stage
    Owner               = "Crossfeed managed resource"
    ApplicationRole     = ""
    BillingProject      = ""
    Confidentiality     = ""
    Criticality         = ""
    Environment         = ""
    FismaID             = "PRE-08561-GSS-08561"
    OperationalStatus   = "Stage"
    ResourceSavings     = ""
    Security            = ""
    Lifecycle_TargetTag = "Sunday-02"
  }
  root_block_device {
    volume_size = 15
  }

  vpc_security_group_ids = [aws_security_group.allow_internal.id]
  subnet_id              = data.aws_ssm_parameter.subnet_db_1_id.value

  iam_instance_profile = aws_iam_instance_profile.db_accessor.id
  user_data            = file("./ssm-agent-install.sh")

  lifecycle {
    # prevent_destroy = true
    ignore_changes = [ami]
  }
}