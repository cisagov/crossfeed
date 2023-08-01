# provider.tf

# Specify the provider and access details
terraform {
  required_providers {
    aws = {
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region                   = var.aws_region
  shared_credentials_files = ["$HOME/.aws/credentials"]
}

provider "aws" {
  alias                    = "other"
  region                   = var.aws_other_region
  shared_credentials_files = ["$HOME/.aws/credentials"]
}

terraform {
  backend "s3" {
    encrypt = true
  }
}
