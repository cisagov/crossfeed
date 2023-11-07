#!/bin/bash
# Deploys worker to Terraform.
# If the worker_ecs_repository_url output from Terraform changes, you should replace "XXX.dkr.ecr.us-east-1.amazonaws.com" in this file with that URL.
# To deploy staging, run ./deploy-worker.sh.
# To deploy prod, run ./deploy-worker.sh crossfeed-prod-worker.

set -e

AWS_ECR_DOMAIN=957221700844.dkr.ecr.us-east-1.amazonaws.com

WORKER_TAG=${1:-crossfeed-staging-worker}
PE_WORKER_TAG=${1:-pe-staging-worker}

./tools/build-worker.sh
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ECR_DOMAIN
docker tag crossfeed-worker:latest $AWS_ECR_DOMAIN/$WORKER_TAG:latest
docker push $AWS_ECR_DOMAIN/$WORKER_TAG:latest

docker tag pe-worker:latest $AWS_ECR_DOMAIN/$PE_WORKER_TAG:latest
docker push $AWS_ECR_DOMAIN/$PE_WORKER_TAG:latest
