resource "aws_security_group" "elasticache_security_group" {
  name_prefix = "elasticache-"
  description = "ElastiCache security group"

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.2.0/24"] // Restrict to a specific CIDR block, ideally your VPC's CIDR
  }
}

resource "aws_elasticache_subnet_group" "crossfeed_vpc" {
  name       = "aws_vpc.crossfeed_vpc"
  subnet_ids = [aws_subnet.backend.id]

  tags = {
    Name = "crossfeed_vpc"
  }
}

resource "aws_elasticache_cluster" "crossfeed_vpc_elasticache_cluster" {
  count                = var.create_elastcache_cluster ? 1 : 0
  cluster_id           = "crossfeed-vpc-cluster"
  engine               = "redis"
  node_type            = "cache.t2.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  engine_version       = "3.2.10"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.crossfeed_vpc.name
  security_group_ids   = [aws_security_group.elasticache_security_group.id]

  tags = {
    Name = "crossfeed_vpc_elasticache-cluster"
    Project = var.project
    Stage   = var.stage
  }
}
