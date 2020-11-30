---
title: Deployment
sidenav: contributing
---

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

To change the environment variables used to build the backend, edit `env.yaml`. Most of these
variables are set through SSM variables (which should be set manually / through Terraform -- see below),
but some of these variables are hard-coded and configurable by just editing `env.yaml`.

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
cp stage.env .env
npm run build
aws s3 sync build/ s3://staging.crossfeed.cyber.dhs.gov/ --delete
aws cloudfront create-invalidation --distribution-id ELM2YU1N4NV9M --paths "/index.html"
```

You may need to change the values in `stage.env` or `prod.env` if you need to change the environment variables
that are used to build the frontend.

### First-time Setup

To deploy this app for the first time, you need to do a couple of things:

- Set up a custom domain for the frontend and create an ACM certificate for it
- Generate a login.gov RSA key
- Set initial SSM variables

#### Generate login.gov RSA key

Run the following to generate a login.gov RSA key (preferably in a non-git directory outside of crossfeed!):

```bash
openssl genrsa -out private.pem 2048
openssl req -newkey rsa:2048 -nodes -days 3650 -out csr.pem
openssl x509 -req -in csr.pem -out cert.pem -signkey private.pem
npm install -g pem-jwk
pem-jwk private.pem > private.jwk
```

Visit [the Login.gov sandbox dashboard](https://dashboard.int.identitysandbox.gov/) to create a login.gov application, providing `cert.pem` as the public certificate. Copy the contents of `private.jwk` to use as your `LOGIN_GOV_JWT_KEY` in the next step.

#### Set initial SSM variables

First, make sure you set the following SSM variables manually through the AWS Console (replace `staging` with `prod` as needed). Make sure these variables are set as "SecureString":

- `/crossfeed/staging/DATABASE_USER`
- `/crossfeed/staging/DATABASE_PASSWORD`
- `/crossfeed/staging/APP_JWT_SECRET`
- `/crossfeed/staging/CENSYS_API_ID`
- `/crossfeed/staging/CENSYS_API_SECRET`
- `/crossfeed/staging/LOGIN_GOV_REDIRECT_URI`
- `/crossfeed/staging/LOGIN_GOV_BASE_URL`
- `/crossfeed/staging/LOGIN_GOV_JWT_KEY`
- `/crossfeed/staging/LOGIN_GOV_ISSUER`
- `/crossfeed/staging/WORKER_USER_AGENT`
- `/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY`
- `/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY`
- `/crossfeed/staging/REACT_APP_TERMS_VERSION`

#### Create service-linked role for Amazon ES

You must also [create a service-linked role for Amazon ES](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/slr-es.html#create-slr) (this only needs to be created once per AWS account):

```bash
aws iam create-service-linked-role --aws-service-name es.amazonaws.com
```

#### Use Terraform

Then, run `cp stage.config .env` and change the variables in `.env` to use a bucket you have access to to store state.

Make sure you configure the default AWS profile using `aws configure` , or set the `AWS_PROFILE` environment variable in `.env`.

Then run:

```bash
npm i -g dotenv-cli
make init
make plan
make apply
```
