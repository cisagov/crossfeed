resource "aws_vpc" "crossfeed_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "db_1" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.1.0/28"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "db_2" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.1.16/28"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "backend" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.2.0/24"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "worker" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.3.0/24"

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_subnet" "es_1" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.4.0/28"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "matomo_1" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.5.0/28"

  tags = {
    Project = var.project
  }
}

resource "aws_route_table" "r" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_route_table" "r2" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  route {
    nat_gateway_id = aws_nat_gateway.nat.id
    cidr_block     = "0.0.0.0/0"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_route_table" "worker" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  route {
    gateway_id = aws_internet_gateway.gw.id
    cidr_block = "0.0.0.0/0"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_route_table_association" "r_assoc_db_1" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.db_1.id
}

resource "aws_route_table_association" "r_assoc_db_2" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.db_2.id
}

resource "aws_route_table_association" "r_assoc_backend" {
  route_table_id = aws_route_table.r2.id
  subnet_id      = aws_subnet.backend.id
}

resource "aws_route_table_association" "r_assoc_matomo" {
  route_table_id = aws_route_table.r2.id
  subnet_id      = aws_subnet.matomo_1.id
}

resource "aws_route_table_association" "r_assoc_worker" {
  route_table_id = aws_route_table.worker.id
  subnet_id      = aws_subnet.worker.id
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
  }
}

resource "aws_eip" "nat_eip" {
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.worker.id

  tags = {
    Project = var.project
    Stage   = var.stage
  }
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

# TODO: remove this security group. We can't remove it right now because
# AWS created an ENI in this security group that can't be deleted at the moment.
# See https://www.reddit.com/r/aws/comments/4fncrl/dangling_enis_after_deleting_an_invpc_lambda_with/
resource "aws_security_group" "backend" {
  name        = "backend"
  description = "Backend"
  vpc_id      = aws_vpc.crossfeed_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.crossfeed_vpc.cidr_block]
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
