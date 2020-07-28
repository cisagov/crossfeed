# Terraform infrastructure

## Setup

First, make sure you set the following SSM variables manually through the AWS Console (replace `staging` with `prod` as needed). Make sure these variables are set as "SecureString":

- `/crossfeed/staging/DATABASE_USER`
- `/crossfeed/staging/DATABASE_PASSWORD`
- `/crossfeed/staging/APP_JWT_SECRET`
- `/crossfeed/staging/CENSYS_API_ID`
- `/crossfeed/staging/CENSYS_API_SECRET`
- `/crossfeed/staging/LOGIN_GOV_REDIRECT_URI`
- `/crossfeed/staging/LOGIN_GOV_BASE_URL`
- `/crossfeed/staging/LOGIN_GOV_JWT_KEY`

Then, run `cp stage.config .env` and change the variables in `.env` to use a bucket you have access to to store state.

Make sure you configure the default AWS profile using `aws configure` , or set the `AWS_PROFILE` environment variable in `.env`.

Then run:

```bash
npm i -g dotenv-cli
make init
```

## Deployment to staging

Run:

```bash
make plan
make apply
```
