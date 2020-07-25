variable aws_region {
  type    = string
  default = "us-west-2"
}

variable project {
  type    = string
  default = "Crossfeed"
}

variable stage {
  type    = string
  default = "staging"
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

variable frontend_cert_arn {
  type    = string
  default = "arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"
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

variable ssm_worker_sg {
  type    = string
  default = ""
}

variable ssm_worker_subnet {
  type    = string
  default = ""
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

variable cloudfront_name {
  type    = string
  default = "Crossfeed Staging Frontend"
}

variable db_group_name {
  type    = string
  default = "crossfeed-db-group"
}

variable worker_ecs_repository_name {
  type    = string
  default = "crossfeed-worker-staging"
}

variable worker_ecs_cluster_name {
  type    = string
  default = "crossfeed-worker-staging"
}

variable worker_ecs_task_definition_family {
  type    = string
  default = "crossfeed-worker-staging"
}

variable worker_ecs_log_group_name {
  type    = string
  default = "crossfeed-worker-staging"
}

variable worker_ecs_role_name {
  type    = string
  default = "crossfeed-worker-staging"
}