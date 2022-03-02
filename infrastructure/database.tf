data "aws_ssm_parameter" "db_password" { name = var.ssm_db_password }
data "aws_ssm_parameter" "db_username" { name = var.ssm_db_username }

resource "aws_db_subnet_group" "default" {
  name       = var.db_group_name
  subnet_ids = [aws_subnet.db_1.id, aws_subnet.db_2.id]

  tags = {
    Project = var.project
  }
}

resource "aws_db_instance" "db" {
  identifier                          = var.db_name
  instance_class                      = var.db_instance_class
  allocated_storage                   = 100
  max_allocated_storage               = 1000
  storage_type                        = "gp2"
  engine                              = "postgres"
  skip_final_snapshot                 = true
  availability_zone                   = data.aws_availability_zones.available.names[0]
  multi_az                            = false
  backup_retention_period             = 35
  storage_encrypted                   = true
  iam_database_authentication_enabled = true

  // database information
  name     = var.db_table_name
  username = data.aws_ssm_parameter.db_username.value
  password = data.aws_ssm_parameter.db_password.value
  port     = var.db_port

  db_subnet_group_name = aws_db_subnet_group.default.name

  vpc_security_group_ids = [aws_security_group.allow_internal.id]

  tags = {
    Project = "Crossfeed"
  }
}

data "aws_ami" "ubuntu" {

  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  # Canonical
  owners = ["099720109477"]
}

resource "aws_instance" "db_accessor" {
  count         = var.create_db_accessor_instance ? 1 : 0
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.medium"

  tags = {
    Project = var.project
    Stage   = var.stage
  }

  vpc_security_group_ids = [aws_security_group.allow_internal.id]
  subnet_id              = aws_subnet.backend.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_ssm_parameter" "lambda_sg_id" {
  name      = var.ssm_lambda_sg
  type      = "String"
  value     = aws_security_group.allow_internal.id
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "lambda_subnet_id" {
  name      = var.ssm_lambda_subnet
  type      = "String"
  value     = aws_subnet.backend.id
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "worker_sg_id" {
  name      = var.ssm_worker_sg
  type      = "String"
  value     = aws_security_group.worker.id
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "worker_subnet_id" {
  name      = var.ssm_worker_subnet
  type      = "String"
  value     = aws_subnet.worker.id
  overwrite = true

  tags = {
    Project = var.project
  }
}


resource "aws_ssm_parameter" "crossfeed_send_db_host" {
  name      = var.ssm_db_host
  type      = "SecureString"
  value     = aws_db_instance.db.address
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "crossfeed_send_db_name" {
  name      = var.ssm_db_name
  type      = "SecureString"
  value     = aws_db_instance.db.name
  overwrite = true

  tags = {
    Project = var.project
  }
}
