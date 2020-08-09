aws_region        = "us-east-1"
project           = "Crossfeed"
stage             = "prod"
frontend_domain   = "crossfeed.cyber.dhs.gov"
api_domain        = "api.crossfeed.cyber.dhs.gov"
frontend_cert_arn = "arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"
db_name           = "crossfeed-prod-db"
db_port           = 5432
db_table_name     = "cfproddb"
db_instance_class = "db.t3.large"
db_storage_encrypted = true
ssm_lambda_subnet = "/crossfeed/prod/SUBNET_ID"
ssm_lambda_sg     = "/crossfeed/prod/SG_ID"
ssm_worker_subnet = "/crossfeed/prod/WORKER_SUBNET_ID"
ssm_worker_sg     = "/crossfeed/prod/WORKER_SG_ID"
ssm_db_name       = "/crossfeed/prod/DATABASE_NAME"
ssm_db_host       = "/crossfeed/prod/DATABASE_HOST"
ssm_db_username   = "/crossfeed/prod/DATABASE_USER"
ssm_db_password   = "/crossfeed/prod/DATABASE_PASSWORD"
cloudfront_name   = "Crossfeed Prod Frontend"
db_group_name     = "crossfeed-prod-db-group"
worker_ecs_repository_name        = "crossfeed-prod-worker"
worker_ecs_cluster_name           = "crossfeed-prod-worker"
worker_ecs_task_definition_family = "crossfeed-prod-worker"
worker_ecs_log_group_name         = "crossfeed-prod-worker"
worker_ecs_role_name         = "crossfeed-prod-worker"
