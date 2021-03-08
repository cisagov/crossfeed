---
title: Frontend
sidenav: dev
---

The frontend is built in React. The code can be found in the `frontend` directory.
When running Crossfeed locally, the frontend is served from the container
`crossfeed_frontend_1`. We use the following technologies
on the frontend:

- React
- AWS Cognito
- AWS Amplify
- Elastic Search UI
- Material UI

### Directory structure

The `src` folder contains all the React components.

Some React components contain tests, which are located in the `__tests__` directory.

### Configuration

To configure properties on the frontend (such as Cognito user pool settings), you can modify
all environment variables beginning with `REACT_APP_`, which are accessbile to the frontend.

If you are running Crossfeed locally, you can just modify these variables in `.env` in the root
directory. If you need to configure the frontend for deployment, you should update the
`prod.env` and `stage.env` files.

Here is a list of all environment variables:

| Name                            | Description                                                               | Sample value                                  |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| `REACT_APP_API_URL`             | URL for REST API                                                          | `https://api.staging.crossfeed.cyber.dhs.gov` |
| `REACT_APP_FARGATE_LOG_GROUP`   | Fargate log group (used for linking to the logs of ScanTasks)             | `crossfeed-staging-worker`                    |
| `REACT_APP_USE_COGNITO`         | Set to use cognito, unset to use login.gov                                | `1`                                           |
| `REACT_APP_USER_POOL_ID`        | Cognito user pool ID                                                      | `us-east-1_uxiY8DOum`                         |
| `REACT_APP_USER_POOL_CLIENT_ID` | Cognito user pool client ID                                               | `1qf4cii9v0t9hn1hnr54f2ao0j`                  |
| `REACT_APP_TERMS_VERSION`       | TOS version                                                               | `1`                                           |
| `REACT_APP_COOKIE_DOMAIN`       | Cookie domain (stores JWT, used to access Matomo)                         | `staging.crossfeed.cyber.dhs.gov`             |
| `REACT_APP_TOTP_ISSUER`         | TOTP issuer (shows up as the default name of the credential in a 2FA app) | `Staging Crossfeed`                           |

### Authentication

We use the [AWS Amplify](https://docs.amplify.aws/) library to make REST API calls.

When a user signs in, we store the JWT for that user in the `token` variable in localStorage. This JWT is
passed to all REST API endpoint calls. We do not support refresh tokens at the moment.

### Search UI

We use the [@elastic/react-search-ui](https://github.com/elastic/search-ui) library to power our Search UI.
Most of the integration with this library can be found in the `SearchProvider` component.
