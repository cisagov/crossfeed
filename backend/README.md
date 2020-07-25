
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
npm run deploy-worker
```

If the `worker_ecs_repository_url` output from Terraform changes, you will need to modify `./src/tools/deploy-worker.sh`.
