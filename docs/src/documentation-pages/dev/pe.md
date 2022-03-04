# P&E database setup instructions

## Local

To create the P&E database locally, first run Crossfeed with `npm start`. Then run:

```
cd backend
npm run pesyncdb
```

## Accessor

### Add credentials to SSM

Before deploying. Generate a secure secret value for a database password, then run the following commands:

```
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_NAME" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_USERNAME" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_PASSWORD" --value "[generated secret password]" --type "SecureString"
```

You can generate a secret password by running:

```bash
python3
>>> import secrets; print(secrets.token_hex())
```


### Sync DB

Run:

```bash
aws lambda invoke --function-name crossfeed-staging-pesyncdb --log-type Tail --region us-east-1 /dev/stderr --query 'LogResult' --output text | base64 -d
```

# Accessing the database

Retrieve the database credentials by running the following command in the terraformer instance:

```
aws ssm get-parameter --name "/crossfeed/staging/DATABASE_HOST" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_NAME" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_USERNAME" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_PASSWORD" --with-decryption
```

Once you SSH into the accessor instance, you can use these credentials when connecting to the database. The port should be 5432.

# Populate the database with pg dump file

Locate the latest postgres dump file and run:

'''
pg_restore -U pe -d pe "[path to sql dump file]"
'''
