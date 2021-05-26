aws_region                        = "us-east-1"
project                           = "Crossfeed"
stage                             = "staging"
frontend_domain                   = "staging.crossfeed.cyber.dhs.gov"
frontend_lambda_function          = "crossfeed-security-headers-staging"
frontend_bucket                   = "staging.crossfeed.cyber.dhs.gov"
api_domain                        = "api.staging.crossfeed.cyber.dhs.gov"
frontend_cert_arn                 = "arn:aws:acm:us-east-1:957221700844:certificate/4fd47c3b-2d55-44e3-bdea-d258318e63ce"
db_name                           = "crossfeed-stage-db"
db_port                           = 5432
db_table_name                     = "cfstagingdb"
db_instance_class                 = "db.t3.micro"
db_storage_encrypted              = true
ssm_lambda_subnet                 = "/crossfeed/staging/SUBNET_ID"
ssm_lambda_sg                     = "/crossfeed/staging/SG_ID"
ssm_worker_subnet                 = "/crossfeed/staging/WORKER_SUBNET_ID"
ssm_worker_sg                     = "/crossfeed/staging/WORKER_SG_ID"
ssm_worker_arn                    = "/crossfeed/staging/WORKER_CLUSTER_ARN"
ssm_db_name                       = "/crossfeed/staging/DATABASE_NAME"
ssm_db_host                       = "/crossfeed/staging/DATABASE_HOST"
ssm_db_username                   = "/crossfeed/staging/DATABASE_USER"
ssm_db_password                   = "/crossfeed/staging/DATABASE_PASSWORD"
ssm_worker_signature_public_key   = "/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY"
ssm_worker_signature_private_key  = "/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY"
ssm_censys_api_id                 = "/crossfeed/staging/CENSYS_API_ID"
ssm_censys_api_secret             = "/crossfeed/staging/CENSYS_API_SECRET"
ssm_shodan_api_key                = "/crossfeed/staging/SHODAN_API_KEY"
ssm_hibp_api_key                  = "/crossfeed/staging/HIBP_API_KEY"
ssm_lg_api_key                    = "/crossfeed/staging/LG_API_KEY"
cloudfront_name                   = "Crossfeed Staging Frontend"
db_group_name                     = "crossfeed-staging-db-group"
worker_ecs_repository_name        = "crossfeed-staging-worker"
worker_ecs_cluster_name           = "crossfeed-staging-worker"
worker_ecs_task_definition_family = "crossfeed-staging-worker"
worker_ecs_log_group_name         = "crossfeed-staging-worker"
worker_ecs_role_name              = "crossfeed-staging-worker"
export_bucket_name                = "cisa-crossfeed-staging-exports"
user_pool_name                    = "crossfeed-staging"
user_pool_domain                  = "crossfeed-staging"
ssm_user_pool_id                  = "/crossfeed/staging/USER_POOL_ID"
ssm_user_pool_client_id           = "/crossfeed/staging/USER_POOL_CLIENT_ID"
ses_support_email_sender          = "noreply@staging.crossfeed.cyber.dhs.gov"
ses_support_email_replyto         = "vulnerability@cisa.dhs.gov"
matomo_ecs_cluster_name           = "crossfeed-matomo-staging"
matomo_ecs_task_definition_family = "crossfeed-matomo-staging"
matomo_ecs_log_group_name         = "crossfeed-matomo-staging"
matomo_db_name                    = "crossfeed-matomo-staging"
matomo_db_instance_class          = "db.t3.micro"
matomo_ecs_role_name              = "crossfeed-matomo-staging"
es_instance_type                  = "t3.small.elasticsearch"
es_instance_count                 = 1
es_instance_volume_size           = 100
