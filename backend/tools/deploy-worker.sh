#!/bin/bash
# Deploys worker to terraform.
# If the worker_ecs_repository_url output from Terraform changes, you should replace "563873274798.dkr.ecr.us-east-1.amazonaws.com" in this file with that URL.

set -e

AWS_ECR_DOMAIN=563873274798.dkr.ecr.us-east-1.amazonaws.com

./build-worker.sh
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ECR_DOMAIN
docker tag crossfeed-worker:latest $AWS_ECR_DOMAIN/crossfeed-staging-worker:latest
docker push $AWS_ECR_DOMAIN/crossfeed-staging-worker:latest