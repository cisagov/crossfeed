# provider.tf

# Specify the provider and access details
provider "aws" {
  region                  = var.aws_region
}

provider "aws" {
  alias  = "virginia"
  region = "us-east-1"
}

terraform {
  backend "s3" {
    encrypt = true
  }
}
#
