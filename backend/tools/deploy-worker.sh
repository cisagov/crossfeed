#!/bin/bash
# Deploys worker to terraform.
# If the worker_ecs_repository_url output from Terraform changes, you should replace "563873274798.dkr.ecr.us-east-1.amazonaws.com" in this file with that URL.

set -e

docker build -t crossfeed-worker -f Dockerfile.worker .
$(aws ecr get-login --no-include-email --region us-east-1)
docker tag crossfeed-worker:latest 563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest
docker push 563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest