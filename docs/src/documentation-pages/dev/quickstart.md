---
title: Quickstart
sidenav: dev
---

This quickstart describes the initial setup required to run an instance of Crossfeed on your local computer.

### Initial Setup

1. Install [Node.js](https://nodejs.org/en/download/) 14 and [Docker Compose](https://docs.docker.com/compose/install/). Make sure the Docker daemon is running.

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

5. Generate the initial DB schema and populate it with sample data:

   ```bash
   cd backend
   # Generate schema
   npm run syncdb
   # Populate sample data
   npm run syncdb -- -d populate
   ```

   If you ever need to drop and recreate the database, you can run `npm run syncdb -- -d dangerouslyforce`.

6. Navigate to [http://localhost](http://localhost) in a browser.

7. Create an account on the [staging Crossfeed instance](https://staging.crossfeed.cyber.dhs.gov/signup?). You can then log into your account running on localhost using this account.

8. Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting Docker Compose is required. The following are examples of changes that will require restarting the environment:

   - Frontend or backend dependency changes
   - Backend changes to `serverless.yml` or `env.yml`
   - Environment variables in root `.env`

9. Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save.

### Running tests

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

To view a code coverage report (a minimum code coverage threshold is checked in CI), run `npm test -- --collectCoverage`. You can then view a HTML coverage report in the `coverage/lcov-report` directory.

### Monitoring Docker containers

To see which Docker containers are running, you can run:

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

### Further information

To see more information about the design and development of each component of Crossfeed,
see the following links:

- [Frontend](frontend.md) for the React frontend.
- [REST API](rest-api.md) for the REST API.
- [Database](database.md) for the database models stored in Postgres.
- [Worker](worker.md) for the worker system and adding new scans and data sources.
- [Search](search.md) for the search infrastructure and setup with Elasticsearch.
- [Analytics](analytics.md) for the analytics setup with Matomo.

### Documentation

The documentation files are stored in the `docs` directory and served from a Gatsby site. To work on this, you should run `npm start` from before. You can then open up [http://localhost:4000](http://localhost:4000) in your browser to view the docs.

The docs are based on the [federalist-uswds-gatsby](https://github.com/18F/federalist-uswds-gatsby) theme. See that repository for more information on additional theme customizations that can be done.
