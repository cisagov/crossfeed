Terraform infrastructure

# Setup

Make sure you set the default AWS profile, or set the `AWS_PROFILE` environment variable.

First, run `cp stage.config .env` and change the variables in `.env` to use a bucket you have access to to store state.

Then run:

```bash
npm i -g dotenv
make init
```


# Deployment to staging

Run:

```bash
make plan
make apply
```