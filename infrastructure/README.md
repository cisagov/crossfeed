# Terraform infrastructure

## Setup

First, run `cp stage.config .env` and change the variables in `.env` to use a bucket you have access to to store state.

Make sure you configure the default AWS profile using `aws configure`, or set the `AWS_PROFILE` environment variable in `.env`.

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