![Deploy Backend](https://github.com/cisagov/crossfeed/workflows/Backend%20Pipeline/badge.svg?branch=master)
![Deploy Frontend](https://github.com/cisagov/crossfeed/workflows/Frontend%20Pipeline/badge.svg?branch=master)
![Deploy Infrastructure](https://github.com/cisagov/crossfeed/workflows/Deploy%20Infrastructure/badge.svg?branch=master)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# Crossfeed

External monitoring for organization assets

## Development Environment

1.  Copy root `dev.env.example` file to a `.env`

    - `cp dev.env.example .env`

2.  Enter a value for BD_API_KEY and change values as desired in `.env`

3.  Start entire environment from root using docker compose

    - `docker-compose up --build`

4.  Navigate to [localhost](http://localhost) in a browser

5.  Hot reloading for source files is enabled, but after changes to non-source code files stopping and starting docker compose is required. The following are examples of changes that will require restarting the environment:

    - frontend or backend dependency changes
    - backend `serverless.yml` or `env.yml`
    - environment variables in root `.env`

6.  Generate DB schema: `docker-compose exec backend npx sls invoke local -f syncdb` (`-d dangerouslyforce` to drop and recreate)

7. Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save

## Running non-http lambdas locally

Some of the lambdas are set to run on an interval or in response to non-http events. To run one of these, for example to populate initial data from a data source, use the following command:

- `docker-compose run backend npx serverless invoke local -f [function name]`
- ex. `docker-compose run backend npx serverless invoke local -f findomain`

If the function takes an input, it can be provided with `-d`. For example, the bitdiscovery task provides an optional input for a max count of assets to fetch.

- ex. `docker-compose run backend npx serverless invoke local -f bitdiscovery -d 500`

## Running tests

To run tests, first make sure you have already started crossfeed with `docker-compose`. Then run:

```
cd backend
npm test
```

To update snapshots, run `npm test -- -u`.

## Architecture

![](https://github.com/cisagov/crossfeed/blob/master/docs/architecture.png)
