resource "aws_vpc" "crossfeed_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "lambda_subnet" {
  availability_zone = data.aws_availability_zones.available.names[0]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.1.0/24"

  tags = {
    Project = var.project
  }
}

resource "aws_subnet" "lambda_subnet2" {
  availability_zone = data.aws_availability_zones.available.names[1]
  vpc_id            = aws_vpc.crossfeed_vpc.id
  cidr_block        = "10.0.2.0/24"

  tags = {
    Project = var.project
  }
}

resource "aws_route_table" "r" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
  }
}

resource "aws_route_table" "r2" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
  }
}

resource "aws_route_table_association" "r_assoc" {
  route_table_id = aws_route_table.r.id
  subnet_id      = aws_subnet.lambda_subnet.id
}

resource "aws_route_table_association" "r_assoc2" {
  route_table_id = aws_route_table.r2.id
  subnet_id      = aws_subnet.lambda_subnet2.id
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.crossfeed_vpc.id

  tags = {
    Project = var.project
  }
}

resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.r2.id
  gateway_id             = aws_internet_gateway.gw.id
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_eip" "nat_eip" {

}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.lambda_subnet2.id

  tags = {
    Project = var.project
  }
}

resource "aws_route" "nat_gw_rt" {
  route_table_id         = aws_route_table.r.id
  nat_gateway_id         = aws_nat_gateway.nat.id
  destination_cidr_block = "0.0.0.0/0"
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
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project
  }
}
