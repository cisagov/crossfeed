---
title: REST API
sidenav: dev
---

The REST API is built using Express. The code can be found in the `backend` directory.
When running Crossfeed locally, the REST API is served from the container
`crossfeed_backend_1`. We use the following technologies
on the backend:

- Express
- TypeScript
- Serverless Framework
- TypeORM

### Directory structure

The `src` folder contains all the code for the REST API. Most endpoints are located
within the `src/api` directories, while database models are in the `src/models` directory.

Most endpoints have tests, which are located in the `test` directory.

The `serverless.yml` file contains configuration for REST API deployment. The REST API
is deployed as a single lambda function that serves multiple routes through API Gateway
and Express.

### Configuration

To configure properties for the REST API, you can modify
environment variables in `.env` in the root directory.

If you need to configure the REST API for deployment, you should update the
`env.yml` file. You may also need to update parameters in AWS SSM, as several
environment variables use values that are stored in SSM.

<!-- TODO: document environment variables -->
<!-- Here is a list of all environment variables:

| Name                            | Description                                                               | Sample value                                  |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| `REACT_APP_API_URL`             | URL for REST API                                                          | `https://api.staging.crossfeed.cyber.dhs.gov` | -->

### Authentication

Once a user logs in either with Cognito or login.gov, they call the `/auth/callback` on the REST API
with their credential from either provider.

The REST API then verifies the credential and issues the user a JWT. The user uses this server-provided JWT
to authenticate any future requests to the Crossfeed API by passing the JWT in the `Authorization` header.

One can also pass an API Key in the `Authorization` header when accessing the REST API programmatically. For more details, see [API Reference](/api-reference/).
