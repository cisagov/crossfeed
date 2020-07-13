# data "aws_route53_zone" "zone" {
#   name         = "dds.mil."
#   private_zone = false
# }

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_ssm_parameter" "prod_api_domain" {
  name      = "/crossfeed/prod/DOMAIN"
  type      = "String"
  value     = "api.crossfeed2.dds.mil"
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "stage_api_domain" {
  name      = "/crossfeed/staging/DOMAIN"
  type      = "String"
  value     = "stage.api.crossfeed2.dds.mil"
  overwrite = true

  tags = {
    Project = var.project
  }
}
