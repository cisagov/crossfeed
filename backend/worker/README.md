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
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 870467738435.dkr.ecr.us-east-1.amazonaws.com
docker tag crossfeed-worker:latest 870467738435.dkr.ecr.us-east-1.amazonaws.com/crossfeed-worker:latest
docker push 870467738435.dkr.ecr.us-east-1.amazonaws.com/crossfeed-worker:latest
```