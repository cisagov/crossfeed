## Creating your own instance of Crossfeed

When you create your own instance of Crossfeed, you can customize many aspects of how it looks. The `dev.env.example` file contains a full list of all customizable variables.

To deploy Crossfeed for the first time in a fresh AWS environment, you need to do a couple of things:

- Set up a custom domain for the frontend and create an ACM certificate for it
- Set up authentication mechanism (Cognito or login.gov) Generate a login.gov RSA key
- Set initial SSM variables
- Configure User Agent and request signing
- Configure other environment variables

### Set up a custom domain for the frontend

Pick a custom domain for your frontend and create an [ACM certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html) for your domain. Then, set the `frontend_domain` and `frontend_cert_arn` variables in `infrastructure/stage.tfvars` and `infrastructure/prod.tfvars` accordingly.

### Set up authentication mechanism (Cognito or login.gov)

Choose between using Cognito or login.gov. login.gov can only be used if you are
a government agency, so you'll most likely just want to use Cognito.

#### Cognito setup

You can perform these Cognito setup steps after the user pools have been created after you first run Terraform ([mentioned below](#use-terraform)).

In `backend/env.yml`, set the following variables:

```
USE_COGNITO: 1
REACT_APP_USER_POOL_ID: us-east-1_uxiY8DOum
```

In `frontend/stage.env` / `frontend/prod.env`, make sure the following environment variables are set:

```
REACT_APP_USE_COGNITO=1
REACT_APP_USER_POOL_ID=us-east-1_uxiY8DOum
REACT_APP_USER_POOL_CLIENT_ID=1qf4cii9v0t9hn1hnr54f2ao0j
```

#### login.gov setup

In `backend/env.yml`, `frontend/stage.env`, and `frontend/prod.env`, remove the lines that set the `USE_COGNITO` or `REACT_APP_USE_COGNITO` environment variables. Both variables must be unset for login.gov authentication to be used!

Run the following to generate a login.gov RSA key (preferably in a non-git directory outside of crossfeed!):

```bash
openssl genrsa -out private.pem 2048
openssl req -newkey rsa:2048 -nodes -days 3650 -out csr.pem
openssl x509 -req -in csr.pem -out cert.pem -signkey private.pem
npm install -g pem-jwk
pem-jwk private.pem > private.jwk
```

Visit [the Login.gov sandbox dashboard](https://dashboard.int.identitysandbox.gov/) to create a login.gov application, providing `cert.pem` as the public certificate. Copy the contents of `private.jwk` to use as your `LOGIN_GOV_JWT_KEY`, which is stored in SSM in the next step.

### Set initial SSM variables

First, make sure you set the following SSM variables manually through the AWS Console (replace `staging` with `prod` as needed). Make sure these variables are set as "SecureString":

- `/crossfeed/staging/DATABASE_USER`
- `/crossfeed/staging/DATABASE_PASSWORD`
- `/crossfeed/staging/APP_JWT_SECRET`
- `/crossfeed/staging/REACT_APP_TERMS_VERSION`

Optional variables:

- `/crossfeed/staging/WORKER_USER_AGENT`
- `/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY`
- `/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY`
- `/crossfeed/staging/CENSYS_API_ID`
- `/crossfeed/staging/CENSYS_API_SECRET`
- `/crossfeed/staging/SHODAN_API_KEY`
- `/crossfeed/staging/HIBP_API_KEY`
- `/crossfeed/staging/SIXGILL_CLIENT_ID`
- `/crossfeed/staging/SIXGILL_CLIENT_SECRET`
- `/crossfeed/staging/PE_SHODAN_API_KEYS`
- `/crossfeed/staging/LG_API_KEY`
- `/crossfeed/staging/LG_WORKSPACE_NAME`
- `/crossfeed/staging/LOGIN_GOV_REDIRECT_URI`
- `/crossfeed/staging/LOGIN_GOV_BASE_URL`
- `/crossfeed/staging/LOGIN_GOV_JWT_KEY`
- `/crossfeed/staging/LOGIN_GOV_ISSUER`

### Use Terraform

Run `cd infrastructure`. Then, create a new bucket on S3 that can be used to store terraform state; make sure the bucket is private, bucket versioning is enabled, and server-side encryption is enabled. Then run `cp stage.config .env` and change the variables in `.env` to use this bucket name.

Make sure you configure the default AWS profile using `aws configure` , or set the `AWS_PROFILE` environment variable in `.env`.

You must also [create a service-linked role for Amazon ES](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/slr-es.html#create-slr) (this only needs to be created once per AWS account):

```bash
aws iam create-service-linked-role --aws-service-name es.amazonaws.com
```

Then run:

```bash
make init
make plan
make apply
```

### Configure User Agent and request signing

Crossfeed's workers, when performing requets, can optionally send a User Agent identifying the requestor as Crossfeed
and a `Signature` header to verify that Crossfeed is performing the request.

To do this, you can set the `WORKER_USER_AGENT`, the `WORKER_SIGNATURE_PUBLIC_KEY`, and the `WORKER_SIGNATURE_PRIVATE_KEY` parameters in your env file:

```
WORKER_USER_AGENT="Crossfeed (Test request from Crossfeed Staging Environment, for development use only. For more information, see https://github.com/cisagov/crossfeed)"
WORKER_SIGNATURE_PUBLIC_KEY="public key, can have newlines"
WORKER_SIGNATURE_PRIVATE_KEY="private key, can have newlines"
```

Note that when deploying Crossfeed to AWS, the worker signature public and private keys should also be set as SSM secrets (such as `/crossfeed/staging/WORKER_SIGNATURE_PUBLIC_KEY` and `/crossfeed/staging/WORKER_SIGNATURE_PRIVATE_KEY`).

#### Generating RSA keys

The public and private key values can be generated by running:

```bash
ssh-keygen -m PEM -t rsa -f test_key
ssh-keygen -f test_key.pub -m 'PEM' -e > test_key.pem
```

The public key is the value of `test_key.pem` and the private key is the value of `test_key`.

#### Verifying a request

One can then verify that requests are coming from Crossfeed by providing you with the following parts of the request:

- Value of the `Date` header
- Value of the `Signature` header
- Request method
- Request URL

You can call the `SignRequests.verify_signature` method (found in `backend/worker/mitmproxy_sign_requests.py`) to verify a signature with
the above four parts of a request. Crossfeed will later have an admin UI that allows admins to run this check directly from the web interface.

### Configure other environment variables

The full list of configurable environment variables are provided in `.env` (used in local development), `frontend/stage.env`, `frontend/prod.env`, and `backend/env.yml`. Additionally, more settings from the Terraform end are stored in `infrastructure/stage.tfvars` and `infrastructure/prod.tfvars`.
