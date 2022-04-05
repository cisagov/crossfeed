# provider.tf

# Specify the provider and access details
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  shared_credentials_files = ["$HOME/.aws/credentials"]
  alias                    = "virginia"
  region                   = "us-east-1"
}

terraform {
  backend "s3" {
    encrypt = true
  }
}
