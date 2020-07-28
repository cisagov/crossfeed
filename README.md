![Deploy Backend](https://github.com/cisagov/crossfeed/workflows/Backend%20Pipeline/badge.svg?branch=master)
![Deploy Frontend](https://github.com/cisagov/crossfeed/workflows/Frontend%20Pipeline/badge.svg?branch=master)
![Deploy Infrastructure](https://github.com/cisagov/crossfeed/workflows/Deploy%20Infrastructure/badge.svg?branch=master)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

<p align="center">
<img alt="Crossfeed logo" src="frontend/src/components/Header/cisa_logo.png">
</p>

# Crossfeed

External monitoring for organization assets.

Crossfeed allows you to add a list of domains for each organization and periodically schedule passive or active scanning on them. Users of each organization can monitor their own assets through a self-service portal, and access to resources can be managed through RBAC.

Crossfeed is a collaboration between the [Cybersecurity and Infrastructure Security Agency](https://www.cisa.gov/) and the [Defense Digital Service](https://dds.mil/).

## Development Environment

1.  Copy root `dev.env.example` file to a `.env` file, and change values as desired:
    - `cp dev.env.example .env`
1.  Build the crossfeed-worker Docker image
    - `cd backend && npm run build-worker`
1.  Start entire environment from root using Docker Compose
    - `docker-compose up --build`
1.  Generate DB schema: `docker-compose exec backend npx sls invoke local -f syncdb` ( `-d dangerouslyforce` to drop and recreate)

1.  Navigate to [localhost](http://localhost) in a browser.

1.  Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting docker compose is required. The following are examples of changes that will require restarting the environment:
    - frontend or backend dependency changes
    - backend `serverless.yml` or `env.yml`
    - environment variables in root `.env`
8.  Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save.

### Running the scheduler lambda function locally

The scheduler lambda function is set to run on an interval or in response to non-http events. To run it manually, run the following command:

* `docker-compose exec scheduler npx serverless invoke local -f scheduler`

### Running tests

To run tests, first make sure you have already started crossfeed with `docker-compose` . Then run:

``` bash
cd backend
npm test
```

To update snapshots, run `npm test -- -u` .

## Architecture

![](https://github.com/cisagov/crossfeed/blob/master/docs/architecture.png)

Additional documentation on system design can be found in the [docs folder](/docs).

## Public domain

This project is in the worldwide [public domain](LICENSE.md).

This project is in the public domain within the United States, and
copyright and related rights in the work worldwide are waived through
the [CC0 1.0 Universal public domain
dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0
dedication. By submitting a pull request, you are agreeing to comply
with this waiver of copyright interest.
