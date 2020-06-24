variable aws_region {
  type    = string
  default = "us-west-2"
}

variable project {
  type    = string
  default = "Crossfeed"
}

variable db_port {
  type    = number
  default = 5432
}

variable db_name {
  type    = string
  default = "crossfeed-stage-db"
}

variable api_domain {
  type    = string
  default = "stage.api.crossfeed2.dds.mil"
}

variable frontend_domain {
  type    = string
  default = "stage.crossfeed2.dds.mil"
}

variable ssm_db_name {
  type    = string
  default = "/crossfeed/staging/DATABASE_NAME"
}

variable ssm_db_host {
  type    = string
  default = "/crossfeed/staging/DATABASE_HOST"
}

variable ssm_lambda_sg {
  type    = string
  default = "/crossfeed/staging/SG_ID"
}

variable ssm_lambda_subnet {
  type    = string
  default = "/crossfeed/staging/SUBNET_ID"
}

variable db_table_name {
  type    = string
  default = "cfstagedb"
}

variable ssm_db_username {
  type    = string
  default = "/crossfeed/staging/DATABASE_USER"
}

variable ssm_db_password {
  type    = string
  default = "/crossfeed/staging/DATABASE_PASSWORD"
}

variable ssm_user_pool {
  type    = string
  default = "/crossfeed/prod/USER_POOL"
}

variable cloudfront_name {
  type    = string
  default = "Crossfeed Staging Frontend"
}

variable db_group_name {
  type    = string
  default = "crossfeed-db-group"
}

variable user_pool {
  type = map
  default = {
    name     = "crossfeed-stage-users"
    domain   = "crossfeed-stage"
    app_name = "stage-auth"
  }
}
