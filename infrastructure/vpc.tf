data "aws_ssm_parameter" "vpc_name" { name = var.ssm_crossfeed_vpc_name }


resource "aws_vpc" "crossfeed_vpc" {
  cidr_block           = "10.236.32.0/21"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Project = var.project
    Name    = data.aws_ssm_parameter.vpc_name.value
  }
}

resource "aws_subnet" "db_1" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.36.0/24"

  tags = {
    Project = var.project
    Name    = "Crossfeed-Stage_GovEast_Private-A"
  }
}

resource "aws_subnet" "db_2" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.37.0/24"

  tags = {
    Project = var.project
    Name    = "Crossfeed-Stage_GovEast_Private-B"
  }
}

resource "aws_subnet" "backend" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.34.0/26"

  tags = {
    Project = var.project
    Name    = "Crossfeed-Stage_GovEast_Endpoint-A"
  }
}

resource "aws_subnet" "worker" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.34.64/26"

  tags = {
    Project = var.project
    Stage   = var.stage
    Name    = "Crossfeed-Stage_GovEast_Endpoint-B"
  }
}

resource "aws_subnet" "es_1" {
  availability_zone = data.aws_availability_zones.available.names[2]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.38.0/24"

  tags = {
    Project = var.project
    Name    = "Crossfeed-Stage_GovEast_Private-C"
  }
}

resource "aws_subnet" "matomo_1" {
  availability_zone = data.aws_availability_zones.available.names[2]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.236.34.128/26"

  tags = {
    Project = var.project
    Name    = "Crossfeed-Stage_GovEast_Endpoint-C"
  }
}

resource "aws_route_table" "r" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
    Stage   = var.stage
    Name    = "Crossfeed-Stage_GovEast_Endpoint"
  }
}

resource "aws_route_table" "private_A" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
    Stage   = var.stage
    Name    = "Crossfeed-Stage_GovEast_Private-A"
  }
}

resource "aws_route_table" "private_B" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
    Stage   = var.stage
    Name    = "Crossfeed-Stage_GovEast_Private-B"
  }
}

resource "aws_route_table" "private_C" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
    Stage   = var.stage
    Name    = "Crossfeed-Stage_GovEast_Private-C"
  }
}


resource "aws_route_table_association" "r_assoc_backend" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.backend.id
}

resource "aws_route_table_association" "r_assoc_worker" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.worker.id
}

resource "aws_route_table_association" "r_assoc_matomo" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.matomo_1.id
}

resource "aws_route_table_association" "r_assoc_db1" {
  route_table_id = aws_route_table.private_A.id
  subnet_id      = aws_subnet.db_1.id
}

resource "aws_route_table_association" "r_assoc_db2" {
  route_table_id = aws_route_table.private_B.id
  subnet_id      = aws_subnet.db_2.id
}

resource "aws_route_table_association" "r_assoc_es_1" {
  route_table_id = aws_route_table.private_C.id
  subnet_id      = aws_subnet.es_1.id
}

resource "aws_security_group" "allow_internal" {
  name        = "allow-internal"
  description = "Allow All VPC Internal Traffic"
  vpc_id      = aws_vpc.crossfeed_vpc.id

  ingress {
    description = "All Lambda Subnet"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.crossfeed_vpc.cidr_block]
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
  }
}

resource "aws_security_group" "worker" {
  name        = "worker"
  description = "Worker"
  vpc_id      = aws_vpc.crossfeed_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}
