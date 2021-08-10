---
title: Deployment
sidenav: dev
---

### Automatic deployment of CISA Crossfeed

Deployment of CISA Crossfeed is done automatically through GitHub Actions from the [cisagov/crossfeed](https://github.com/cisagov/crossfeed) GitHub repository.

Any code pushed to the `master` branch is automatically deployed to the [staging site](https://staging.crossfeed.cyber.dhs.gov/), and any code pushed to the `production` branch is automatically deployed to the [production site](https://crossfeed.cyber.dhs.gov/).

[Environments](https://docs.github.com/en/actions/reference/environments) are configured to ensure that only specific users with the appropriate permissions can trigger workflows on GitHub Actions or access secrets that perform deployments. At the moment, GitHub Actions jobs that deploy to staging and prod or access credentials for those AWS environments must be [manually approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments).

#### Setting up automatic deployment

To set up automatic deployment to your own AWS environment, you must first create an IAM user with enough permissions to the right resources on AWS. Then, set the GitHub repository's secrets `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` to the access credentials of this user.

### Manual deployment steps

Here are instructions on how to deploy the different components of Crossfeed manually.

#### Infrastructure

Infrastructure is managed by Terraform. To deploy to staging, run:

```bash
cd infrastructure
make init
make plan
make apply
```

#### Backend

The backend API is managed by the Serverless Framework. To deploy, run:

```bash
cd backend
npx sls create_domain --stage=staging
npx sls deploy --stage=staging
```

To change the environment variables used to build the backend, edit `env.yaml`. Most of these
variables are set through SSM variables (which should be set manually / through Terraform -- see below),
but some of these variables are hard-coded and configurable by just editing `env.yaml`.

#### Worker

Deploying the worker involves building the Docker image and pushing it to ECR:

```bash
cd backend
npm run deploy-worker
```

If the `worker_ecs_repository_url` output from Terraform changes, you will need to modify `./src/tools/deploy-worker.sh`.

#### Frontend

Deploying the frontend involves building the React code, uploading it to an S3 bucket, then invalidating the Cloudfront cache:

```bash
cd frontend
cp stage.env .env
npm run build
aws s3 sync build/ s3://staging.crossfeed.cyber.dhs.gov --delete
```
