# P&E database setup instructions

## Local

To run the P&E database setup script locally, first run Crossfeed with `npm start`. Then run:

```
cd backend
npm run pesyncdb
```

## Production (COOL)

### Add credentials to SSM

Before running `npm run deploy-red` for the first time, we need to add the P&E database credentials into AWS SSM. Generate a secure secret value for a database password, then run the following commands on the terraformer instance:

```
aws ssm put-parameter --name "/crossfeed/prod/PE_DATABASE_NAME" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/prod/PE_DATABASE_USER" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/prod/PE_DATABASE_PASSWORD" --value "[generated secret password]" --type "SecureString"
```

### Sync DB

On production, go to the terraformer instance and run:

```
aws lambda invoke --function-name crossfeed-prod-pesyncdb --log-type Tail --region us-east-1 /dev/stderr --query 'LogResult' --output text | base64 -d
```

# Accessing the database

First, retrieve the database credentials by running the following command in the terraformer instance:

```
aws ssm get-parameter --name "/crossfeed/prod/PE_DATABASE_NAME" --with-decryption
aws ssm get-parameter --name "/crossfeed/prod/PE_DATABASE_USER" --with-decryption
aws ssm get-parameter --name "/crossfeed/prod/PE_DATABASE_PASSWORD" --with-decryption
```

You can use these credentials when connecting with a bastion to access the database.
