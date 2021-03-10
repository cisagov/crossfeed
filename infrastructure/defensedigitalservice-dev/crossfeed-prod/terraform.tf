terraform {
  required_version = "~> 0.13"

  backend "s3" {
    bucket = "cisa-cd-crossfeed-terraform-state-prod"
    region = "us-east-1"
    # dynamodb_table = "tbd"
    key     = "PROD/frontend-prod.tfstate"
    encrypt = "true"
  }
}
