![Deploy Backend](https://github.com/cisagov/crossfeed/workflows/Backend%20Pipeline/badge.svg?branch=master)
![Deploy Frontend](https://github.com/cisagov/crossfeed/workflows/Frontend%20Pipeline/badge.svg?branch=master)
![Deploy Infrastructure](https://github.com/cisagov/crossfeed/workflows/Deploy%20Infrastructure/badge.svg?branch=master)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# Crossfeed

External monitoring for organization assets

Crossfeed is a collaboration between the [Cybersecurity and Infrastructure Security Agency](https://www.cisa.gov/) and the [Defense Digital Service](https://dds.mil/).

## Development Environment

1.  Copy root `dev.env.example` file to a `.env`

    - `cp dev.env.example .env`

2.  Enter a value for BD_API_KEY and change values as desired in `.env`

3.  Build the crossfeed-worker Docker image

    - `cd backend && docker build -t crossfeed-worker -f Dockerfile.worker .`

4.  Start entire environment from root using docker compose

    - `docker-compose up --build`

5.  Navigate to [localhost](http://localhost) in a browser

6.  Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting docker compose is required. The following are examples of changes that will require restarting the environment:

    - frontend or backend dependency changes
    - backend `serverless.yml` or `env.yml`
    - environment variables in root `.env`

7.  Generate DB schema: `docker-compose exec backend npx sls invoke local -f syncdb` (`-d dangerouslyforce` to drop and recreate)

8.  Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save

## Running the scheduler lambda function locally

The scheduler lambda function is set to run on an interval or in response to non-http events. To run it manually, run the following command:

- `docker-compose exec scheduler npx serverless invoke local -f scheduler`

## Running tests

To run tests, first make sure you have already started crossfeed with `docker-compose`. Then run:

```bash
cd backend
npm test
```

To update snapshots, run `npm test -- -u`.

## Architecture

![](https://github.com/cisagov/crossfeed/blob/master/docs/architecture.png)

## Public domain

This project is in the worldwide [public domain](LICENSE.md).

This project is in the public domain within the United States, and
copyright and related rights in the work worldwide are waived through
the [CC0 1.0 Universal public domain
dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0
dedication. By submitting a pull request, you are agreeing to comply
with this waiver of copyright interest.
