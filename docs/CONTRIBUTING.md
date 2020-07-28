# Contributing to Crossfeed

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
1.  Install [Prettier](https://www.robinwieruch.de/how-to-use-prettier-vscode) in your dev environment to format code on save.

### Running the scheduler lambda function locally

The scheduler lambda function is set to run on an interval or in response to non-http events. To run it manually, run the following command:

- `docker-compose exec scheduler npx serverless invoke local -f scheduler`

### Running tests

To run tests, first make sure you have already started crossfeed with `docker-compose` . Then run:

```bash
cd backend
npm test
```

To update snapshots, run `npm test -- -u` .
