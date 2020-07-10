Fargate worker.

## Running locally

```bash
docker build -t crossfeed-worker .
docker run crossfeed-worker "amass"
docker run crossfeed-worker "findomain"
```

## Publishing

First create an ECR repository called "crossfeed-worker". Then:

```
docker build -t crossfeed-worker .
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 870467738435.dkr.ecr.us-west-2.amazonaws.com
docker tag crossfeed-worker:latest 870467738435.dkr.ecr.us-west-2.amazonaws.com/crossfeed-staging-worker:latest
docker push 870467738435.dkr.ecr.us-west-2.amazonaws.com/crossfeed-staging-worker:latest
```

Replace the "870467738435.dkr.ecr.us-west-2.amazonaws.com/crossfeed-staging-worker" with the output `worker_ecs_repository_url` from Terraform.