---
title: Development Setup
sidenav: contributing
---

### Quickstart

1. Install [Node.js](https://nodejs.org/en/download/) and [Docker Compose](https://docs.docker.com/compose/install/).

2. Copy root `dev.env.example` file to a `.env` file.

   ```bash
   cp dev.env.example .env
   ```

3. Build the crossfeed-worker Docker image:

   ```bash
   cd backend && npm run build-worker
   ```

4. Start the entire environment from the root directory:

   ```bash
   npm start
   ```

5. Generate the initial DB schema and sample data:

   ```bash
   cd backend
   # Generate schema
   npm run syncdb
   # Generate sample data
   npm run syncdb -- -d populate
   ```

   If you are on Windows, the above commands may not work. Instead, you should run:

   ```bash
   cd backend
   # Generate schema
   docker-compose exec backend npx sls invoke local -f syncdb
   # Generate sample data
   docker-compose exec backend npx sls invoke local -f syncdb -d populate
   ```

   If you ever need to drop and recreate the database, you can run `npm run syncdb -- -d dangerouslyforce`.

6. Navigate to [http://localhost](http://localhost) in a browser.

7. Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting Docker Compose is required. The following are examples of changes that will require restarting the environment:

   - Frontend or backend dependency changes
   - Backend changes to `serverless.yml` or `env.yml`
   - Environment variables in root `.env`

8. Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save.

#### Running tests

To run tests, first make sure you have already started Crossfeed with `npm start` (or, at bare minimum, that the database container is running). Then run:

```bash
cd backend
npm test
```

If snapshot tests fail, update snapshots by running `npm test -- -u`.

To run tests for the subset of worker code that is written in Python, you need to run:

```bash
pip install -r worker/requirements.txt
pytest
```

To view a code coverage report (a minimum code coverage threshold is checked in CI), run `npm test -- --collectCoverage`.

You can then view a HTML coverage report in the `coverage/lcov-report` directory.

#### Monitoring Docker logs

To check Docker containers, you can run:

```bash{outputLines: 2-10}
docker ps
CONTAINER ID        IMAGE                                                 COMMAND                  CREATED             STATUS              PORTS                                            NAMES
2a155c5bb9ce        crossfeed_backend                                     "docker-entrypoint.s…"   13 minutes ago      Up 13 minutes       0.0.0.0:3000->3000/tcp                           crossfeed_backend_1
0177dff83a80        docker.elastic.co/elasticsearch/elasticsearch:7.9.0   "/tini -- /usr/local…"   13 minutes ago      Up 13 minutes       0.0.0.0:9200->9200/tcp, 0.0.0.0:9300->9300/tcp   crossfeed_es_1
c0f3dee36d5e        crossfeed_frontend                                    "docker-entrypoint.s…"   13 minutes ago      Up 13 minutes       0.0.0.0:80->3000/tcp                             crossfeed_frontend_1
f3491e1b547e        matomo:3.14.1                                         "/entrypoint.sh apac…"   13 minutes ago      Up 13 minutes       80/tcp                                           crossfeed_matomo_1
c3ed457a71d2        postgres:latest                                       "docker-entrypoint.s…"   13 minutes ago      Up 13 minutes       0.0.0.0:5432->5432/tcp                           crossfeed_db_1
98c14a4f8886        mariadb:10.5                                          "docker-entrypoint.s…"   13 minutes ago      Up 13 minutes       3306/tcp                                         crossfeed_matomodb_1
9f70dbdbe867        crossfeed_docs                                        "docker-entrypoint.s…"   13 minutes ago      Up 13 minutes       0.0.0.0:4000->4000/tcp                           crossfeed_docs_1
746956c514ed        bitnami/minio:2020.9.26                               "/opt/bitnami/script…"   13 minutes ago      Up 13 minutes       0.0.0.0:9000->9000/tcp                           crossfeed_minio_1
```

You can then check the logs of a particular container by specifying a container's name with the `docker logs` command. For example:

```bash
docker logs crossfeed_backend_1 --follow
```

### Running scans locally

In order to run scans locally or work on scanning infrastructure,
you will need to set up the Fargate worker and rebuild it periodically
when worker code changes.

#### Building the worker Docker image

Each time you make changes to the worker code, you should run the following command to re-build the worker docker image:

```bash
npm run build-worker
```

#### Running workers locally

To run a worker locally, just create a scan from the Crossfeed UI.
When running locally, the scheduler function runs every 30 seconds, for convenience, so it will
start your worker soon. To manually trigger a run immediately, click on the "Manually run scheduler" button on the Scans page.

Once a worker has started, it is accessible as a running Docker container.
You can examine it by running `docker ps` or ( `docker ps -a | head -n 3` for stopped workers ) to view Docker containers.
and check its logs with `docker logs [containername]` .

You can check the scheduler logs locally by checking the backend container logs.

#### Generating censys types

The `censysIpv4.ts` and `censysCertificates.ts` type files in the `backend/src/models/generated` files have been
automatically generated from Censys's published schemas. If you need to re-generate these type files, run:

```bash
npm run codegen
```

### Documentation

The documentation files are stored in the `docs` directory and served from a Gatsby site. To work on this, you should run `npm start` from before. You can then open up [http://localhost:4000](http://localhost:4000) in your browser to view the docs.

The docs are based on the [federalist-uswds-gatsby](https://github.com/18F/federalist-uswds-gatsby) theme. See that repository for more information on additional theme customizations that can be done.

### Matomo for Analytics

[Matomo](https://matomo.org/) is an open source analytics platform. We host an instance of Matomo as part of Crossfeed to collect analytics
on its usage.

Before you run Matomo for the first time locally, you must run `./setup-matomo.sh`.

You can access Matomo by clicking on the "Matomo" button from the "My Account" page. Click
through the original setup (keep the default values for database connection, etc.),
then set the superuser username and password to "root" and "password" (for development only; for deployment to production, you should generate a random password).

### Kibana

By default, Kibana is disabled because it adds a lot of overhead to local development and isn't required for normally running Crossfeed locally.

If you want to view a local version of Kibana (if you, for example, want to inspect the data of the local Elasticsearch instance), you should first uncomment the "kib" section of `docker-compose.yml` and then navigate to [http://localhost:5601](http://localhost:5601).
