
# Fargate worker

## Running locally

```bash
docker build -t crossfeed-worker -f Dockerfile.worker .
docker run crossfeed-worker "amass"
docker run crossfeed-worker "findomain"
```

To run the scheduler:

```bash
docker-compose exec scheduler npx serverless invoke local -f scheduler && docker ps -a | head -n 2
docker logs happy_lovelace
```

## Publishing

Run:

```
npm run deploy-worker
```

If the `worker_ecs_repository_url` output from Terraform changes, you will need to modify `./src/tools/deploy-worker.sh`.

## Extra setup

Go to your AWS account at https://us-east-1.console.aws.amazon.com/ecs/home?region=us-east-1#/settings and enable the new ARN / resource ID checkboxes for ECS.

You must perform this setup before creating resources with Terraform; if not, you must destroy and recreate your ECS resources in order for the new ARN naming scheme to apply to them.