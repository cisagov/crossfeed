variable "aws_region" {
  description = "aws_region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "project"
  type        = string
  default     = "Crossfeed"
}

variable "stage" {
  description = "stage"
  type        = string
  default     = "staging"
}

variable "db_port" {
  description = "db_port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "db_name"
  type        = string
  default     = "crossfeed-stage-db"
}

variable "db_instance_class" {
  description = "db_instance_class"
  type        = string
  default     = "db.t3.micro"
}

variable "api_domain" {
  description = "api_domain"
  type        = string
  default     = "api.staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_domain" {
  description = "frontend_domain"
  type        = string
  default     = "staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_bucket" {
  description = "frontend_bucket"
  type        = string
  default     = "staging.crossfeed.cyber.dhs.gov"
}

variable "frontend_lambda_function" {
  description = "frontend_lambda_function"
  type        = string
  default     = "crossfeed-security-headers-staging"
}

variable "frontend_cert_arn" {
  description = "frontend_cert_arn"
  type        = string
  default     = "arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"
}

variable "log_metric_namespace" {
  description = "log_metric_namespace"
  type        = string
  default     = "LogMetrics"
}

variable "log_metric_api_error_rate" {
  description = "log_metric_filter_api_error_rate"
  type        = string
  default     = "crossfeed-staging-APIErrorRate"
}

variable "log_metric_root_user" {
  description = "log_metric_filter_root_user"
  type        = string
  default     = "crossfeed-staging-RootUserAccess"
}

variable "log_metric_unauthorized_api_call" {
  description = "log_metric_filter_unauthorized_api_call"
  type        = string
  default     = "crossfeed-staging-UnauthorizedAPICall"
}

variable "log_metric_login_without_mfa" {
  description = "log_metric_filter_login_without_mfa"
  type        = string
  default     = "crossfeed-staging-ConsoleLoginWithoutMFA"
}

variable "log_metric_iam_policy" {
  description = "log_metric_filter_iam_policy"
  type        = string
  default     = "crossfeed-staging-IAMPolicyChange"
}

variable "log_metric_cloudtrail" {
  description = "log_metric_filter_cloudtrail"
  type        = string
  default     = "crossfeed-staging-CloudTrailConfigurationChange"
}

variable "log_metric_login_failure" {
  description = "log_metric_filter_login_failure"
  type        = string
  default     = "crossfeed-staging-ConsoleLoginFailure"
}

variable "log_metric_cmk_delete_disable" {
  description = "log_metric_filter_cmk_delete_disable"
  type        = string
  default     = "crossfeed-staging-DisablingOrScheduledDeletionOfCMK"
}

variable "log_metric_s3_bucket_policy" {
  description = "log_metric_filter_s3_bucket_policy"
  type        = string
  default     = "crossfeed-staging-S3BucketPolicyChange"
}

variable "log_metric_aws_config" {
  description = "log_metric_filter_aws_config"
  type        = string
  default     = "crossfeed-staging-AWSConfigConfigurationChange"
}

variable "log_metric_security_group" {
  description = "log_metric_filter_security_group"
  type        = string
  default     = "crossfeed-staging-SecurityGroupChange"
}

variable "log_metric_nacl" {
  description = "log_metric_filter_nacl"
  type        = string
  default     = "crossfeed-staging-NACLChange"
}

variable "log_metric_network_gateway" {
  description = "log_metric_filter_network_gateway"
  type        = string
  default     = "crossfeed-staging-NetworkGatewayChange"
}

variable "log_metric_route_table" {
  description = "log_metric_filter_route_table"
  type        = string
  default     = "crossfeed-staging-RouteTableChange"
}

variable "log_metric_vpc" {
  description = "log_metric_filter_vpc"
  type        = string
  default     = "crossfeed-staging-VPCChange"
}

variable "log_metric_ec2_shutdown" {
  description = "log_metric_filter_ec2_shutdown"
  type        = string
  default     = "crossfeed-staging-EC2Shutdown"
}

variable "log_metric_db_shutdown" {
  description = "log_metric_filter_DB_shutdown"
  type        = string
  default     = "crossfeed-staging-DBShutdown"
}

variable "log_metric_db_deletion" {
  description = "log_metric_filter_db_deletion"
  type        = string
  default     = "crossfeed-staging-DBDeletion"
}

variable "sns_topic_alarms" {
  description = "sns_alarm_topic_name"
  type        = string
  default     = "crossfeed-staging-cis-alarms"
}

variable "ssm_db_name" {
  description = "ssm_db_name"
  type        = string
  default     = "/crossfeed/staging/DATABASE_NAME"
}

variable "ssm_db_host" {
  description = "ssm_db_host"
  type        = string
  default     = "/crossfeed/staging/DATABASE_HOST"
}

variable "ssm_pe_db_name" {
  description = "ssm_pe_db_name"
  type        = string
  default     = "/crossfeed/staging/PE_DB_NAME"
}

variable "ssm_pe_db_username" {
  description = "ssm_pe_db_username"
  type        = string
  default     = "/crossfeed/staging/PE_DB_USERNAME"
}

variable "ssm_pe_db_password" {
  description = "ssm_pe_db_password"
  type        = string
  default     = "/crossfeed/staging/PE_DB_PASSWORD"
}
variable "ssm_lambda_sg" {
  description = "ssm_lambda_sg"
  type        = string
  default     = "/crossfeed/staging/SG_ID"
}

variable "ssm_lambda_subnet" {
  description = "ssm_lambda_subnet"
  type        = string
  default     = "/crossfeed/staging/SUBNET_ID"
}

variable "ssm_worker_sg" {
  description = "ssm_worker_sg"
  type        = string
  default     = "/crossfeed/staging/WORKER_SG_ID"
}

variable "ssm_worker_subnet" {
  description = "ssm_worker_subnet"
  type        = string
  default     = "/crossfeed/staging/WORKER_SUBNET_ID"
}

variable "ssm_worker_arn" {
  description = "ssm_worker_arn"
  type        = string
  default     = "/crossfeed/staging/WORKER_CLUSTER_ARN"
}

variable "db_table_name" {
  description = "db_table_name"
  type        = string
  default     = "cfstagedb"
}

variable "ssm_db_username" {
  description = "ssm_db_username"
  type        = string
  default     = "/crossfeed/staging/DATABASE_USER"
}

variable "ssm_db_password" {
  description = "ssm_db_password"
  type        = string
  default     = "/crossfeed/staging/DATABASE_PASSWORD"
}

variable "ssm_matomo_db_password" {
  description = "ssm_matomo_db_password"
  type        = string
  default     = "/crossfeed/staging/MATOMO_DATABASE_PASSWORD"
}

variable "ssm_worker_signature_public_key" {
  description = "ssm_worker_signature_public_key"
  type        = string
  default     = "/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY"
}

variable "ssm_worker_signature_private_key" {
  description = "ssm_worker_signature_private_key"
  type        = string
  default     = "/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY"
}

variable "ssm_censys_api_id" {
  description = "ssm_censys_api_id"
  type        = string
  default     = "/crossfeed/staging/CENSYS_API_ID"
}

variable "ssm_censys_api_secret" {
  description = "ssm_censys_api_secret"
  type        = string
  default     = "/crossfeed/staging/CENSYS_API_SECRET"
}

variable "ssm_shodan_api_key" {
  description = "ssm_shodan_api_key"
  type        = string
  default     = "/crossfeed/staging/SHODAN_API_KEY"
}

variable "ssm_hibp_api_key" {
  description = "ssm_hibp_api_key"
  type        = string
  default     = "/crossfeed/staging/HIBP_API_KEY"
}

variable "ssm_pe_shodan_api_keys" {
  description = "ssm_pe_shodan_api_keys"
  type        = string
  default     = "/crossfeed/staging/PE_SHODAN_API_KEYS"
}

variable "ssm_sixgill_client_id" {
  description = "ssm_sixgill_client_id"
  type        = string
  default     = "/crossfeed/staging/SIXGILL_CLIENT_ID"
}

variable "ssm_sixgill_client_secret" {
  description = "ssm_sixgill_client_secret"
  type        = string
  default     = "/crossfeed/staging/SIXGILL_CLIENT_SECRET"
}

variable "ssm_intelx_api_key" {
  description = "ssm_intelx_api_key"
  type        = string
  default     = "/crossfeed/staging/INTELX_API_KEY"
}


variable "ssm_lg_api_key" {
  description = "ssm_lg_api_key"
  type        = string
  default     = "/crossfeed/staging/LG_API_KEY"
}

variable "ssm_pe_api_key" {
  description = "ssm_pe_api_key"
  type        = string
  default     = "/crossfeed/staging/PE_API_KEY"
}

variable "ssm_cf_api_key" {
  description = "ssm_cf_api_key"
  type        = string
  default     = "/crossfeed/staging/CF_API_KEY"
}

variable "ssm_lg_workspace_name" {
  description = "ssm_lg_workspace_name"
  type        = string
  default     = "/crossfeed/staging/LG_WORKSPACE_NAME"
}

variable "ssm_shodan_queue_url" {
  description = "ssm_shodan_queue_url"
  type        = string
  default     = "/crossfeed/staging/SHODAN_QUEUE_URL"
}

variable "ssm_dnstwist_queue_url" {
  description = "ssm_dnstwist_queue_url"
  type        = string
  default     = "/crossfeed/staging/DNSTWIST_QUEUE_URL"
}

variable "ssm_hibp_queue_url" {
  description = "ssm_hibp_queue_url"
  type        = string
  default     = "/crossfeed/staging/HIBP_QUEUE_URL"
}

variable "ssm_intelx_queue_url" {
  description = "ssm_intelx_queue_url"
  type        = string
  default     = "/crossfeed/staging/INTELX_QUEUE_URL"
}

variable "ssm_cybersixgill_queue_url" {
  description = "ssm_cybersixgill_queue_url"
  type        = string
  default     = "/crossfeed/staging/CYBERSIXGILL_QUEUE_URL"
}

variable "db_group_name" {
  description = "db_group_name"
  type        = string
  default     = "crossfeed-db-group"
}

variable "worker_ecs_repository_name" {
  description = "worker_ecs_repository_name"
  type        = string
  default     = "crossfeed-worker-staging"
}

variable "worker_ecs_cluster_name" {
  description = "worker_ecs_cluster_name"
  type        = string
  default     = "crossfeed-worker-staging"
}

variable "worker_ecs_task_definition_family" {
  description = "worker_ecs_task_definition_family"
  type        = string
  default     = "crossfeed-worker-staging"
}

variable "worker_ecs_log_group_name" {
  description = "worker_ecs_log_group_name"
  type        = string
  default     = "crossfeed-worker-staging"
}

variable "worker_ecs_role_name" {
  description = "worker_ecs_role_name"
  type        = string
  default     = "crossfeed-worker-staging"
}

variable "logging_bucket_name" {
  description = "logging_bucket_name"
  type        = string
  default     = "cisa-crossfeed-staging-logging"
}

variable "cloudtrail_name" {
  description = "cloudtrail_name"
  type        = string
  default     = "crossfeed-staging-all-events"
}

variable "cloudtrail_bucket_name" {
  description = "cloudtrail_bucket_name"
  type        = string
  default     = "cisa-crossfeed-staging-cloudtrail"
}

variable "cloudtrail_role_name" {
  description = "cloudtrail_role_name"
  type        = string
  default     = "crossfeed-staging-cloudtrail-role"
}

variable "cloudtrail_log_group_name" {
  description = "cloudtrail_log_group_name"
  type        = string
  default     = "crossfeed-staging-cloudtrail-logs"
}

variable "cloudwatch_bucket_name" {
  description = "cloudwatch_bucket_name"
  type        = string
  default     = "cisa-crossfeed-staging-cloudwatch"
}

variable "cloudwatch_log_group_name" {
  description = "cloudwatch_log_group_name"
  type        = string
  default     = "crossfeed-staging-cloudwatch-bucket"
}

variable "export_bucket_name" {
  description = "export_bucket_name"
  type        = string
  default     = "cisa-crossfeed-staging-exports"
}

variable "reports_bucket_name" {
  description = "reports_bucket_name"
  type        = string
  default     = "cisa-crossfeed-reports"
}

variable "pe_db_backups_bucket_name" {
  description = "pe_db_backups_bucket_name"
  type        = string
  default     = "cisa-crossfeed-pe-db-backups"
}

variable "user_pool_name" {
  description = "user_pool_name"
  type        = string
  default     = "crossfeed-staging"
}

variable "user_pool_domain" {
  description = "user_pool_domain"
  type        = string
  default     = "crossfeed-staging"
}

variable "ssm_user_pool_id" {
  description = "ssm_user_pool_id"
  type        = string
  default     = "/crossfeed/staging/USER_POOL_ID"
}

variable "ssm_user_pool_client_id" {
  description = "ssm_user_pool_client_id"
  type        = string
  default     = "/crossfeed/staging/USER_POOL_CLIENT_ID"
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
  description = "matomo_ecs_cluster_name"
  type        = string
  default     = "crossfeed-matomo-staging"
}

variable "matomo_ecs_task_definition_family" {
  description = "matomo_ecs_task_definition_family"
  type        = string
  default     = "crossfeed-matomo-staging"
}

variable "matomo_ecs_log_group_name" {
  description = "matomo_ecs_log_group_name"
  type        = string
  default     = "crossfeed-matomo-staging"
}

variable "matomo_db_name" {
  description = "matomo_db_name"
  type        = string
  default     = "crossfeed-matomo-staging"
}

variable "matomo_db_instance_class" {
  description = "matomo_db_instance_class"
  type        = string
  default     = "db.t3.micro"
}

variable "matomo_ecs_role_name" {
  description = "matomo_ecs_role_name"
  type        = string
  default     = "crossfeed-matomo-staging"
}

variable "es_instance_type" {
  description = "es_instance_type"
  type        = string
  default     = "t2.micro.elasticsearch"
}

variable "es_instance_count" {
  description = "es_instance_count"
  type        = number
  default     = 1
}

variable "es_instance_volume_size" {
  description = "es_instance_volume_size"
  type        = number
  default     = 100
}

variable "create_db_accessor_instance" {
  description = "Whether to create a DB accessor instance. This instance can be used to access RDS and is spun up in a private subnet. It can be accessed using AWS Systems Manager Session Manager."
  type        = bool
  default     = false
}

variable "db_accessor_instance_class" {
  description = "db_accessor_instance_class"
  type        = string
  default     = "t3.micro"
}

variable "elk_instance_class" {
  description = "elk_instance_class"
  type        = string
  default     = "t3.micro"
}

variable "create_elk_instance" {
  description = "Whether to create a ELK instance. This instance can be used to run a ELK cluseter. It can be accessed using AWS Systems Manager Session Manager."
  type        = bool
  default     = false
}

variable "severity_critical" {
  description = "severity_critical"
  type        = string
  default     = "CRITICAL"
}

variable "severity_high" {
  description = "severity_high"
  type        = string
  default     = "HIGH"
}

variable "severity_medium" {
  description = "severity_medium"
  type        = string
  default     = "MEDIUM"
}

variable "severity_low" {
  description = "severity_low"
  type        = string
  default     = "LOW"
}
variable "pe_worker_ecs_repository_name" {
  description = "pe_worker_ecs_repository_name"
  type        = string
  default     = "pe-staging-worker"
}

variable "pe_worker_ecs_cluster_name" {
  description = "pe_worker_ecs_cluster_name"
  type        = string
  default     = "pe-staging-worker"
}

variable "pe_worker_ecs_task_definition_family" {
  description = "pe_worker_ecs_task_definition_family"
  type        = string
  default     = "pe-staging-worker"
}

variable "pe_worker_ecs_log_group_name" {
  description = "pe_worker_ecs_log_group_name"
  type        = string
  default     = "pe-staging-worker"
}

variable "pe_worker_ecs_role_name" {
  description = "pe_worker_ecs_role_name"
  type        = string
  default     = "pe-staging-worker"
}

variable "pe_shodan_ecs_service_name" {
  description = "pe_shodan_ecs_service_name"
  type        = string
  default     = "pe-staging-shodan"
}

variable "pe_dnstwist_ecs_service_name" {
  description = "pe_dnstwist_ecs_service_name"
  type        = string
  default     = "pe-staging-dnstwist"
}

variable "pe_hibp_ecs_service_name" {
  description = "pe_hibp_ecs_service_name"
  type        = string
  default     = "pe-staging-hibp"
}

variable "pe_intelx_ecs_service_name" {
  description = "pe_intelx_ecs_service_name"
  type        = string
  default     = "pe-staging-intelx"
}

variable "pe_cybersixgill_ecs_service_name" {
  description = "pe_cybersixgill_ecs_service_name"
  type        = string
  default     = "pe-staging-cybersixgill"
}