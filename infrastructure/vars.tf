variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "Crossfeed"
}

variable "stage" {
  type    = string
  default = "staging"
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_name" {
  type    = string
  default = "crossfeed-stage-db"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_storage_encrypted" {
  type    = bool
  default = true
}

variable "api_domain" {
  type    = string
  default = "api.staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_domain" {
  type    = string
  default = "staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_bucket" {
  type    = string
  default = "staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_lambda_function" {
  type    = string
  default = "crossfeed-security-headers-staging"
}

variable "frontend_cert_arn" {
  type    = string
  default = "arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"
}

variable "ssm_db_name" {
  type    = string
  default = "/crossfeed/staging/DATABASE_NAME"
}

variable "ssm_pe_db_name" {
  type    = string
  default = "/crossfeed/staging/PE_DATABASE_NAME"
}

variable "ssm_db_host" {
  type    = string
  default = "/crossfeed/staging/DATABASE_HOST"
}

variable "ssm_lambda_sg" {
  type    = string
  default = "/crossfeed/staging/SG_ID"
}

variable "ssm_lambda_subnet" {
  type    = string
  default = "/crossfeed/staging/SUBNET_ID"
}

variable "ssm_worker_sg" {
  type    = string
  default = ""
}

variable "ssm_worker_subnet" {
  type    = string
  default = ""
}

variable "ssm_worker_arn" {
  type    = string
  default = ""
}

variable "db_table_name" {
  type    = string
  default = "cfstagedb"
}

variable "ssm_db_username" {
  type    = string
  default = "/crossfeed/staging/DATABASE_USER"
}

variable "ssm_db_password" {
  type    = string
  default = "/crossfeed/staging/DATABASE_PASSWORD"
}

variable "ssm_pe_db_username" {
  type    = string
  default = "/crossfeed/staging/PE_DATABASE_USER"
}

variable "ssm_pe_db_password" {
  type    = string
  default = "/crossfeed/staging/PE_DATABASE_PASSWORD"
}

variable "ssm_worker_signature_public_key" {
  type    = string
  default = "/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY"
}

variable "ssm_worker_signature_private_key" {
  type    = string
  default = "/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY"
}

variable "ssm_censys_api_id" {
  type    = string
  default = "/crossfeed/staging/CENSYS_API_ID"
}

variable "ssm_censys_api_secret" {
  type    = string
  default = "/crossfeed/staging/CENSYS_API_SECRET"
}

variable "ssm_shodan_api_key" {
  type    = string
  default = "/crossfeed/staging/SHODAN_API_KEY"
}

variable "ssm_hibp_api_key" {
  type    = string
  default = "/crossfeed/staging/HIBP_API_KEY"
}

variable "ssm_lg_api_key" {
  type    = string
  default = "/crossfeed/staging/LG_API_KEY"
}

variable "ssm_lg_workspace_name" {
  type    = string
  default = "/crossfeed/staging/LG_WORKSPACE_NAME"
}

variable "ssm_sixgill_client_id" {
  type    = string
  default = "/crossfeed/staging/SIXGILL_CLIENT_ID"
}

variable "ssm_sixgill_client_secret" {
  type    = string
  default = "/crossfeed/staging/SIXGILL_CLIENT_SECRET"
}

variable "cloudfront_name" {
  type    = string
  default = "Crossfeed Staging Frontend"
}

variable "db_group_name" {
  type    = string
  default = "crossfeed-db-group"
}

variable "worker_ecs_repository_name" {
  type    = string
  default = "crossfeed-worker-staging"
}

variable "worker_ecs_cluster_name" {
  type    = string
  default = "crossfeed-worker-staging"
}

variable "worker_ecs_task_definition_family" {
  type    = string
  default = "crossfeed-worker-staging"
}

variable "worker_ecs_log_group_name" {
  type    = string
  default = "crossfeed-worker-staging"
}

variable "worker_ecs_role_name" {
  type    = string
  default = "crossfeed-worker-staging"
}

variable "export_bucket_name" {
  type    = string
  default = "cisa-crossfeed-staging-exports"
}

variable "user_pool_name" {
  type    = string
  default = "crossfeed-staging"
}

variable "user_pool_domain" {
  type    = string
  default = "crossfeed-staging"
}

variable "ssm_user_pool_id" {
  type    = string
  default = "/crossfeed/staging/USER_POOL_ID"
}

variable "ssm_user_pool_client_id" {
  type    = string
  default = "/crossfeed/staging/USER_POOL_CLIENT_ID"
}

variable "ses_support_email_sender" {
  type        = string
  description = "Email address from which SES emails are sent"
  default     = "noreply@staging.crossfeed.cyber.dhs.gov"
}

variable "ses_support_email_replyto" {
  type        = string
  description = "Email address set in the Reply-To header for SES emails"
  default     = "support@staging.crossfeed.cyber.dhs.gov"
}

variable "matomo_ecs_cluster_name" {
  type    = string
  default = "crossfeed-matomo-staging"
}

variable "matomo_ecs_task_definition_family" {
  type    = string
  default = "crossfeed-matomo-staging"
}

variable "matomo_ecs_log_group_name" {
  type    = string
  default = "crossfeed-matomo-staging"
}

variable "matomo_db_name" {
  type    = string
  default = "crossfeed-matomo-staging"
}

variable "matomo_db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "matomo_ecs_role_name" {
  type    = string
  default = "crossfeed-matomo-staging"
}

variable "es_instance_type" {
  type    = string
  default = "t2.micro.elasticsearch"
}

variable "es_instance_count" {
  type    = number
  default = 1
}

variable "es_instance_volume_size" {
  type    = number
  default = 100
}
