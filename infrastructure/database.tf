data "aws_ssm_parameter" "db_password" { name = var.ssm_db_password }
data "aws_ssm_parameter" "db_username" { name = var.ssm_db_username }

resource "aws_db_subnet_group" "default" {
  name       = var.db_group_name
  subnet_ids = [aws_subnet.db_1.id, aws_subnet.db_2.id]

  tags = {
    Project = var.project
  }
}

resource "aws_db_parameter_group" "default" {
  name   = "crossfeed-${var.stage}-postgres15"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "db" {
  identifier                          = var.db_name
  instance_class                      = var.db_instance_class
  allocated_storage                   = 1000
  max_allocated_storage               = 10000
  storage_type                        = "gp2"
  engine                              = "postgres"
  engine_version                      = "15.3"
  allow_major_version_upgrade         = true
  skip_final_snapshot                 = true
  availability_zone                   = data.aws_availability_zones.available.names[0]
  multi_az                            = false
  backup_retention_period             = 35
  storage_encrypted                   = true
  iam_database_authentication_enabled = true
  enabled_cloudwatch_logs_exports     = ["postgresql", "upgrade"]

  // database information
  db_name  = var.db_table_name
  username = data.aws_ssm_parameter.db_username.value
  password = data.aws_ssm_parameter.db_password.value
  port     = var.db_port

  db_subnet_group_name = aws_db_subnet_group.default.name
  parameter_group_name = aws_db_parameter_group.default.name

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

resource "aws_iam_role" "db_accessor" {
  name               = "crossfeed-db-accessor-${var.stage}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
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

#Instance Profile
resource "aws_iam_instance_profile" "db_accessor" {
  name = "crossfeed-db-accessor-${var.stage}"
  role = aws_iam_role.db_accessor.id
}

#Attach Policies to Instance Role
resource "aws_iam_policy_attachment" "db_accessor_1" {
  name       = "crossfeed-db-accessor-${var.stage}"
  roles      = [aws_iam_role.db_accessor.id]
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_policy_attachment" "db_accessor_2" {
  name       = "crossfeed-db-accessor-${var.stage}"
  roles      = [aws_iam_role.db_accessor.id]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

resource "aws_iam_role_policy" "db_accessor_s3_policy" {
  name_prefix = "crossfeed-db-accessor-s3-${var.stage}"
  role        = aws_iam_role.db_accessor.id
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": ["${aws_s3_bucket.reports_bucket.arn}", "${aws_s3_bucket.reports_bucket.arn}/*", "${aws_s3_bucket.pe_db_backups_bucket.arn}", "${aws_s3_bucket.pe_db_backups_bucket.arn}/*"]
    }
  ]
}
EOF
}

resource "aws_instance" "db_accessor" {
  count                       = var.create_db_accessor_instance ? 1 : 0
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.db_accessor_instance_class
  associate_public_ip_address = false

  tags = {
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

resource "aws_s3_bucket" "reports_bucket" {
  bucket = var.reports_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_policy" "reports_bucket" {
  bucket = var.reports_bucket_name
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "Require SSL for Requests",
        "Effect" : "Deny",
        "Resource" : [
          aws_s3_bucket.reports_bucket.arn,
          "${aws_s3_bucket.reports_bucket.arn}/*"
        ],
        "Condition" : {
          "Bool" : {
            "aws:SecureTransport" : "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_acl" "reports_bucket" {
  bucket = aws_s3_bucket.reports_bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports_bucket" {
  bucket = aws_s3_bucket.reports_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "reports_bucket" {
  bucket = aws_s3_bucket.reports_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "reports_bucket" {
  bucket        = aws_s3_bucket.reports_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "reports_bucket/"
}

resource "aws_s3_bucket" "pe_db_backups_bucket" {
  bucket = var.pe_db_backups_bucket_name
  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

resource "aws_s3_bucket_policy" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "Require SSL for Requests",
        "Effect" : "Deny",
        "Resource" : [
          aws_s3_bucket.pe_db_backups_bucket.arn,
          "${aws_s3_bucket.pe_db_backups_bucket.arn}/*"
        ],
        "Condition" : {
          "Bool" : {
            "aws:SecureTransport" : "false"
          }
        }
      }
      }]
  })
}

resource "aws_s3_bucket_acl" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "pe_db_backups_bucket" {
  bucket = aws_s3_bucket.pe_db_backups_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "pe_db_backups_bucket" {
  bucket        = aws_s3_bucket.pe_db_backups_bucket.id
  target_bucket = aws_s3_bucket.logging_bucket.id
  target_prefix = "pe_db_backups_bucket/"
}

