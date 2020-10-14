data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_ssm_parameter" "prod_api_domain" {
  name      = "/crossfeed/prod/DOMAIN"
  type      = "String"
  value     = "api.crossfeed.cyber.dhs.gov"
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "stage_api_domain" {
  name      = "/crossfeed/staging/DOMAIN"
  type      = "String"
  value     = "api.crossfeed.dds.mil"
  overwrite = true

  tags = {
    Project = var.project
  }
}
