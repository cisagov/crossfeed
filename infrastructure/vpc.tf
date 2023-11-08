data "aws_ssm_parameter" "vpc_name" { name = var.ssm_crossfeed_vpc_name }

data "aws_ssm_parameter" "vpc_id" { name = var.ssm_vpc_id }
data "aws_ssm_parameter" "vpc_cidr_block" { name = var.ssm_vpc_cidr_block }
data "aws_ssm_parameter" "route_table_endpoints_id" { name = var.ssm_route_table_endpoints_id }
data "aws_ssm_parameter" "route_table_private_A_id" { name = var.ssm_route_table_private_A_id }
data "aws_ssm_parameter" "route_table_private_B_id" { name = var.ssm_route_table_private_B_id }
data "aws_ssm_parameter" "route_table_private_C_id" { name = var.ssm_route_table_private_C_id }
data "aws_ssm_parameter" "subnet_backend_id" { name = var.ssm_subnet_backend_id }
data "aws_ssm_parameter" "subnet_worker_id" { name = var.ssm_subnet_worker_id }
data "aws_ssm_parameter" "subnet_matomo_id" { name = var.ssm_subnet_matomo_id }
data "aws_ssm_parameter" "subnet_db_1_id" { name = var.ssm_subnet_db_1_id }
data "aws_ssm_parameter" "subnet_db_2_id" { name = var.ssm_subnet_db_2_id }
data "aws_ssm_parameter" "subnet_es_id" { name = var.ssm_subnet_es_id }


resource "aws_route_table_association" "r_assoc_backend" {
  route_table_id = data.aws_ssm_parameter.route_table_endpoints_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_backend_id.value
}

resource "aws_route_table_association" "r_assoc_worker" {
  route_table_id = data.aws_ssm_parameter.route_table_endpoints_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_worker_id.value
}

resource "aws_route_table_association" "r_assoc_matomo" {
  route_table_id = data.aws_ssm_parameter.route_table_endpoints_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_matomo_id.value
}

resource "aws_route_table_association" "r_assoc_db1" {
  route_table_id = data.aws_ssm_parameter.route_table_private_A_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_db_1_id.value
}

resource "aws_route_table_association" "r_assoc_db2" {
  route_table_id = data.aws_ssm_parameter.route_table_private_B_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_db_2_id.value
}

resource "aws_route_table_association" "r_assoc_es_1" {
  route_table_id = data.aws_ssm_parameter.route_table_private_C_id.value
  subnet_id      = data.aws_ssm_parameter.subnet_es_id.value
}

resource "aws_security_group" "allow_internal" {
  name        = "allow-internal"
  description = "Allow All VPC Internal Traffic"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value

  ingress {
    description = "All Lambda Subnet"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [data.aws_ssm_parameter.vpc_cidr_block.value]
  }

  ingress {
    description = "Nessus Scan"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.232.0.94/32"]
  }

  ingress {
    description = "Crowdstrike Server"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.234.0.0/15", "10.232.0.0/15", "52.61.0.0/17", "10.236.0.0/24", "96.127.0.0/17"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project
    Stage   = var.stage
    Owner   = "Crossfeed managed resource"
  }
}

resource "aws_security_group" "worker" {
  name        = "worker"
  description = "Worker"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project
    Stage   = var.stage
    Owner   = "Crossfeed managed resource"
  }
}
