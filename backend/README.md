# Fargate worker

## Running locally

Each time you make changes to the worker code, you should run:

``` bash
npm run build-worker
```

To run the scheduler:

``` bash
docker-compose exec scheduler npx serverless invoke local -f scheduler
```

You can then run `docker ps` or ( `docker ps -a | head -n 3` ) to view running / stopped Docker containers, 
and check their logs with `docker logs [containername]` .

## Publishing

Run:

``` 
npm run deploy-worker
```

If the `worker_ecs_repository_url` output from Terraform changes, you will need to modify `./src/tools/deploy-worker.sh` .

## Generating censys types

To re-generate the censysipv4 type file, run:

``` 
npm run codegen
```
