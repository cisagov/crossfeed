---
title: Deployment
permalink: /contributing/deployment/

layout: post
sidenav: contributing
subnav:
  - text: Manual Deployment
    href: '#manual-deployment'
  - text: First-time Setup
    href: '#first-time-setup'
---

## Manual Deployment

Deployment is done automatically through GitHub Actions. Any code pushed to the `master` branch is automatically deployed to the Crossfeed staging site, and any code pushed to the `production` branch is automatically deployed to the production site.

The following sections detail the manual deployment process for staging.

### Infrastructure

Infrastructure is managed by Terraform. To deploy to staging, run:

```bash
cd infrastructure
make init
make plan
make apply
```

### Backend

The backend API is managed by the Serverless Framework. To deploy, run:

```bash
cd backend
npx sls create_domain --stage=staging
npx sls deploy --stage=staging
```

### Worker

Deploying the worker involves building the Docker image and pushing it to ECR:

```bash
cd backend
npm run deploy-worker
```

### Frontend

Deploying the frontend involves building the React code, uploading it to an S3 bucket, then invalidating the Cloudfront cache:

```bash
cd frontend
REACT_APP_API_URL=https://api.staging.crossfeed.cyber.dhs.gov npm run build
aws s3 sync build/ s3://staging.crossfeed.cyber.dhs.gov/ --delete
aws cloudfront create-invalidation --distribution-id ELM2YU1N4NV9M --paths "/index.html"
```

## First-time Setup

To deploy this app for the first time, you need to do a couple of things:

- Set up a custom domain for the frontend and create an ACM certificate for it
- Set initial SSM variables

### Set initial SSM variables

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
