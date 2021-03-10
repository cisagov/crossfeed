terraform {
  required_version = "~> 0.13"

  backend "s3" {
    bucket = "dds-crossfeed-ows-terraform-state"
    region = "us-east-1"
    # dynamodb_table = "tbd"
    key     = "STAGE/frontend-stage.tfstate"
    encrypt = "true"
  }
}
