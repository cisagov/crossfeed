
# Fargate worker

## Running locally

```bash
docker build -t crossfeed-worker -f Dockerfile.worker .
docker run crossfeed-worker "amass"
docker run crossfeed-worker "findomain"
```

To run the scheduler:

```bash
docker-compose exec scheduler npx serverless invoke local -f scheduler -d "censysIpv4"
docker-compose exec scheduler npx serverless invoke local -f scheduler && docker ps -a | head -n 2
docker logs happy_lovelace
```

## Publishing

Run:

```
docker build -t crossfeed-worker -f Dockerfile.worker .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 563873274798.dkr.ecr.us-east-1.amazonaws.com
docker tag crossfeed-worker:latest 563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest
docker push 563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest
```

Replace the "870467738435.dkr.ecr.us-west-2.amazonaws.com/crossfeed-staging-worker" with the output `worker_ecs_repository_url` from Terraform.

## Extra setup

Go to your AWS account at https://us-west-2.console.aws.amazon.com/ecs/home?region=us-west-2#/settings and enable the new ARN / resource ID checkboxes for ECS.