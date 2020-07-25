
# Fargate worker

## Running locally

```bash
npm run build-worker
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

## Generating censys types

To re-generate the censysipv4 type file, run:

```
npm run codegen
```