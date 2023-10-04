aws_region                        = "us-east-1"
project                           = "Crossfeed"
stage                             = "prod"
frontend_domain                   = "crossfeed.cyber.dhs.gov"
frontend_lambda_function          = "crossfeed-security-headers-prod"
frontend_bucket                   = "crossfeed.cyber.dhs.gov"
api_domain                        = "api.crossfeed.cyber.dhs.gov"
frontend_cert_arn                 = "arn:aws:acm:us-east-1:957221700844:certificate/6c26ea05-4806-460a-a639-ee204ebde894"
db_name                           = "crossfeed-prod-db2"
db_port                           = 5432
db_table_name                     = "cfproddb"
db_instance_class                 = "db.t3.2xlarge"
ssm_lambda_subnet                 = "/crossfeed/prod/SUBNET_ID"
ssm_lambda_sg                     = "/crossfeed/prod/SG_ID"
ssm_worker_subnet                 = "/crossfeed/prod/WORKER_SUBNET_ID"
ssm_worker_sg                     = "/crossfeed/prod/WORKER_SG_ID"
ssm_worker_arn                    = "/crossfeed/prod/WORKER_CLUSTER_ARN"
ssm_db_name                       = "/crossfeed/prod/DATABASE_NAME"
ssm_db_host                       = "/crossfeed/prod/DATABASE_HOST"
ssm_db_username                   = "/crossfeed/prod/DATABASE_USER"
ssm_db_password                   = "/crossfeed/prod/DATABASE_PASSWORD"
ssm_pe_db_name                    = "/crossfeed/prod/PE_DB_NAME"
ssm_pe_db_username                = "/crossfeed/prod/PE_DB_USERNAME"
ssm_pe_db_password                = "/crossfeed/prod/PE_DB_PASSWORD"
ssm_matomo_db_password            = "/crossfeed/prod/MATOMO_DATABASE_PASSWORD"
ssm_worker_signature_public_key   = "/crossfeed/prod/WORKER_SIGNATURE_PUBLIC_KEY"
ssm_worker_signature_private_key  = "/crossfeed/prod/WORKER_SIGNATURE_PRIVATE_KEY"
ssm_censys_api_id                 = "/crossfeed/prod/CENSYS_API_ID"
ssm_censys_api_secret             = "/crossfeed/prod/CENSYS_API_SECRET"
ssm_shodan_api_key                = "/crossfeed/prod/SHODAN_API_KEY"
ssm_hibp_api_key                  = "/crossfeed/prod/HIBP_API_KEY"
ssm_pe_shodan_api_keys            = "/crossfeed/prod/PE_SHODAN_API_KEYS"
ssm_sixgill_client_id             = "/crossfeed/prod/SIXGILL_CLIENT_ID"
ssm_sixgill_client_secret         = "/crossfeed/prod/SIXGILL_CLIENT_SECRET"
ssm_lg_api_key                    = "/crossfeed/prod/LG_API_KEY"
ssm_lg_workspace_name             = "/crossfeed/prod/LG_WORKSPACE_NAME"
cloudfront_name                   = "Crossfeed Prod Frontend"
db_group_name                     = "crossfeed-prod-db-group"
worker_ecs_repository_name        = "crossfeed-prod-worker"
worker_ecs_cluster_name           = "crossfeed-prod-worker"
worker_ecs_task_definition_family = "crossfeed-prod-worker"
worker_ecs_log_group_name         = "crossfeed-prod-worker"
worker_ecs_role_name              = "crossfeed-prod-worker"
logging_bucket_name               = "cisa-crossfeed-prod-logging"
cloudtrail_name                   = "crossfeed-prod-all-events"
cloudtrail_bucket_name            = "cisa-crossfeed-prod-cloudtrail"
cloudtrail_role_name              = "cisa-crossfeed-prod-cloudtrail"
cloudtrail_log_group_name         = "cisa-crossfeed-prod-cloudtrail"
cloudwatch_bucket_name            = "cisa-crossfeed-prod-cloudwatch"
cloudwatch_log_group_name         = "crossfeed-prod-cloudwatch-bucket"
export_bucket_name                = "cisa-crossfeed-prod-exports"
reports_bucket_name               = "cisa-crossfeed-prod-reports"
pe_db_backups_bucket_name         = "cisa-crossfeed-prod-pe-db-backups"
user_pool_name                    = "crossfeed-prod"
user_pool_domain                  = "crossfeed"
ssm_user_pool_id                  = "/crossfeed/prod/USER_POOL_ID"
ssm_user_pool_client_id           = "/crossfeed/prod/USER_POOL_CLIENT_ID"
ses_support_email_sender          = "noreply@crossfeed.cyber.dhs.gov"
ses_support_email_replyto         = "vulnerability@cisa.dhs.gov"
matomo_ecs_cluster_name           = "crossfeed-matomo-prod"
matomo_ecs_task_definition_family = "crossfeed-matomo-prod"
matomo_ecs_log_group_name         = "crossfeed-matomo-prod"
matomo_db_name                    = "crossfeed-matomo-prod"
matomo_db_instance_class          = "db.t3.micro"
matomo_ecs_role_name              = "crossfeed-matomo-prod"
es_instance_type                  = "m4.large.elasticsearch"
es_instance_count                 = 3
es_instance_volume_size           = 512
create_db_accessor_instance       = true
db_accessor_instance_class        = "t3.2xlarge"
create_elk_instance               = false
elk_instance_class                = "t3.2xlarge"
sqs_queue_name                    = "crossfeed-prod-worker-queue"
