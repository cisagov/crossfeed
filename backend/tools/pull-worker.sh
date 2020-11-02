#!/bin/bash
# Pulls staging worker.
# This makes CI builds much faster if AWS credentials are available,
# as layers can be cached.

AWS_ECR_DOMAIN=957221700844.dkr.ecr.us-east-1.amazonaws.com
WORKER_TAG=$1
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ECR_DOMAIN
docker pull $AWS_ECR_DOMAIN/$WORKER_TAG:latest