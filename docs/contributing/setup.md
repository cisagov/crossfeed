---
title: Development Setup
permalink: /contributing/setup/

layout: post
sidenav: contributing
subnav:
  - text: Quickstart
    href: '#quickstart'
  - text: Fargate worker
    href: '#fargate-worker'
  - text: Documentation
    href: '#documentation'
---

## Quickstart

1.  Copy root `dev.env.example` file to a `.env` file, and change values as desired:
    - `cp dev.env.example .env`
1.  Build the crossfeed-worker Docker image
    - `cd backend && npm run build-worker`
1.  Start entire environment from root using Docker Compose
    - `docker-compose up --build`
1.  Generate DB schema:
    - `cd backend && npm run syncdb`
    - (run `npm run syncdb -- -d dangerouslyforce` to drop and recreate)

1.  Navigate to [localhost](http://localhost) in a browser.

1.  Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting docker compose is required. The following are examples of changes that will require restarting the environment:
    - frontend or backend dependency changes
    - backend `serverless.yml` or `env.yml`
    - environment variables in root `.env`
1.  Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save.

### Running the scheduler lambda function locally

The scheduler lambda function is set to run on a 5-minute interval when deployed.

When running locally, the scheduler function runs every 1 minute, for convenience. To run it manually, click on the "Manually run scheduler" button on the Scans page.

You can check scheduler logs locally by checking the backend container logs.

### Running tests

To run tests, first make sure you have already started crossfeed with `docker-compose`. Then run:

```bash
cd backend
npm test
```

To update snapshots, run `npm test -- -u`.

To view a code coverage report (a minimum code coverage threshold is checked in CI), run `npm test -- --collectCoverage`.

You can then view a HTML coverage report in the `coverage/lcov-report` directory.

To run Python tests for some worker code, you need to run:

```bash
pip install -r worker/requirements.txt
pytest
```

## Fargate worker

In order to run scans locally or work on scanning infrastructure,
you will need to set up the Fargate worker and rebuild it periodically
when worker code changes.

### Running locally

Each time you make changes to the worker code, you should run:

```bash
npm run build-worker
```

To run the scheduler, click on "Manually run scheduler" on the Scans page.

You can then run `docker ps` or ( `docker ps -a | head -n 3` ) to view running / stopped Docker containers,
and check their logs with `docker logs [containername]` .

### Publishing

Run:

```bash
npm run deploy-worker
```

If the `worker_ecs_repository_url` output from Terraform changes, you will need to modify `./src/tools/deploy-worker.sh`.

### Generating censys types

To re-generate the censysIpv4 type file, run:

```bash
npm run codegen
```

## Documentation

The documentation files are stored in the `docs` directory and served from a Jekyll site. To work on this, you can run:

```bash
docker-compose up docs
```

You can then open up [http://localhost:4000][http://localhost:4000] in your browser.

See [uswds-jekyll](https://github.com/18F/uswds-jekyll) for more information on theme customizations that can be done.
