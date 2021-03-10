<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| aws | n/a |
| random | n/a |
| template | n/a |

## Modules

No Modules.

## Resources

| Name |
|------|
| [aws_availability_zones](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/availability_zones) |
| [aws_caller_identity](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) |
| [aws_cloudfront_distribution](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution) |
| [aws_cloudwatch_log_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group) |
| [aws_cloudwatch_log_resource_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_resource_policy) |
| [aws_cognito_user_pool](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool) |
| [aws_cognito_user_pool_client](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool_client) |
| [aws_db_instance](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance) |
| [aws_db_subnet_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_subnet_group) |
| [aws_ecr_repository](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_repository) |
| [aws_ecs_cluster](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_cluster) |
| [aws_ecs_service](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_service) |
| [aws_ecs_task_definition](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_task_definition) |
| [aws_eip](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eip) |
| [aws_elasticsearch_domain](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elasticsearch_domain) |
| [aws_iam_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) |
| [aws_iam_role_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) |
| [aws_internet_gateway](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/internet_gateway) |
| [aws_nat_gateway](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/nat_gateway) |
| [aws_region](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/region) |
| [aws_route_table](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table) |
| [aws_route_table_association](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table_association) |
| [aws_s3_bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) |
| [aws_s3_bucket_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_policy) |
| [aws_security_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group) |
| [aws_service_discovery_private_dns_namespace](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/service_discovery_private_dns_namespace) |
| [aws_service_discovery_service](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/service_discovery_service) |
| [aws_ssm_parameter](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) |
| [aws_ssm_parameter](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter) |
| [aws_subnet](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/subnet) |
| [aws_vpc](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc) |
| [random_password](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) |
| [template_file](https://registry.terraform.io/providers/hashicorp/template/latest/docs/data-sources/file) |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| api\_domain | n/a | `string` | `"api.staging.crossfeed.cyber.dhs.gov"` | no |
| aws\_region | n/a | `string` | `"us-east-1"` | no |
| cloudfront\_name | n/a | `string` | `"Crossfeed Staging Frontend"` | no |
| db\_group\_name | n/a | `string` | `"crossfeed-db-group"` | no |
| db\_instance\_class | n/a | `string` | `"db.t3.micro"` | no |
| db\_name | n/a | `string` | `"crossfeed-stage-db"` | no |
| db\_port | n/a | `number` | `5432` | no |
| db\_storage\_encrypted | n/a | `bool` | `true` | no |
| db\_table\_name | n/a | `string` | `"cfstagedb"` | no |
| es\_instance\_count | n/a | `number` | `1` | no |
| es\_instance\_type | n/a | `string` | `"t2.micro.elasticsearch"` | no |
| es\_instance\_volume\_size | n/a | `number` | `100` | no |
| export\_bucket\_name | n/a | `string` | `"cisa-crossfeed-staging-exports"` | no |
| frontend\_bucket | n/a | `string` | `"staging.crossfeed.cyber.dhs.gov"` | no |
| frontend\_cert\_arn | n/a | `string` | `"arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"` | no |
| frontend\_domain | n/a | `string` | `"staging.crossfeed.cyber.dhs.gov"` | no |
| matomo\_db\_instance\_class | n/a | `string` | `"db.t3.micro"` | no |
| matomo\_db\_name | n/a | `string` | `"crossfeed-matomo-staging"` | no |
| matomo\_ecs\_cluster\_name | n/a | `string` | `"crossfeed-matomo-staging"` | no |
| matomo\_ecs\_log\_group\_name | n/a | `string` | `"crossfeed-matomo-staging"` | no |
| matomo\_ecs\_role\_name | n/a | `string` | `"crossfeed-matomo-staging"` | no |
| matomo\_ecs\_task\_definition\_family | n/a | `string` | `"crossfeed-matomo-staging"` | no |
| project | n/a | `string` | `"Crossfeed"` | no |
| ses\_support\_email | n/a | `string` | `"support@staging.crossfeed.cyber.dhs.gov"` | no |
| ssm\_censys\_api\_id | n/a | `string` | `"/crossfeed/staging/CENSYS_API_ID"` | no |
| ssm\_censys\_api\_secret | n/a | `string` | `"/crossfeed/staging/CENSYS_API_SECRET"` | no |
| ssm\_db\_host | n/a | `string` | `"/crossfeed/staging/DATABASE_HOST"` | no |
| ssm\_db\_name | n/a | `string` | `"/crossfeed/staging/DATABASE_NAME"` | no |
| ssm\_db\_password | n/a | `string` | `"/crossfeed/staging/DATABASE_PASSWORD"` | no |
| ssm\_db\_username | n/a | `string` | `"/crossfeed/staging/DATABASE_USER"` | no |
| ssm\_lambda\_sg | n/a | `string` | `"/crossfeed/staging/SG_ID"` | no |
| ssm\_lambda\_subnet | n/a | `string` | `"/crossfeed/staging/SUBNET_ID"` | no |
| ssm\_user\_pool\_client\_id | n/a | `string` | `"/crossfeed/staging/USER_POOL_CLIENT_ID"` | no |
| ssm\_user\_pool\_id | n/a | `string` | `"/crossfeed/staging/USER_POOL_ID"` | no |
| ssm\_worker\_arn | n/a | `string` | `""` | no |
| ssm\_worker\_sg | n/a | `string` | `""` | no |
| ssm\_worker\_signature\_private\_key | n/a | `string` | `"/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY"` | no |
| ssm\_worker\_signature\_public\_key | n/a | `string` | `"/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY"` | no |
| ssm\_worker\_subnet | n/a | `string` | `""` | no |
| stage | n/a | `string` | `"staging"` | no |
| user\_pool\_domain | n/a | `string` | `"crossfeed-staging"` | no |
| user\_pool\_name | n/a | `string` | `"crossfeed-staging"` | no |
| webscraper\_bucket\_name | n/a | `string` | `"crossfeed-staging-webscraper"` | no |
| worker\_ecs\_cluster\_name | n/a | `string` | `"crossfeed-worker-staging"` | no |
| worker\_ecs\_log\_group\_name | n/a | `string` | `"crossfeed-worker-staging"` | no |
| worker\_ecs\_repository\_name | n/a | `string` | `"crossfeed-worker-staging"` | no |
| worker\_ecs\_role\_name | n/a | `string` | `"crossfeed-worker-staging"` | no |
| worker\_ecs\_task\_definition\_family | n/a | `string` | `"crossfeed-worker-staging"` | no |

## Outputs

| Name | Description |
|------|-------------|
| worker\_ecs\_repository\_url | n/a |
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->