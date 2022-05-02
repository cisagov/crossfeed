# P&E database setup instructions

## Local

To create the P&E database locally, first run Crossfeed with `npm start`. Then in another terminal run:

```
cd backend
npm run pesyncdb
```

The local database will contain the entire schema. The only table with any data is "organizations". Populated with just one record, DHS.

# Accessor

### Add credentials to SSM

Before deploying. Generate a secure secret value for a database password, then run the following commands on the terraformer instance:

```
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_NAME" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_USER" --value "pe" --type "SecureString"
aws ssm put-parameter --name "/crossfeed/staging/PE_DB_PASSWORD" --value "[generated secret password]" --type "SecureString"
```

### Sync DB

Go to the accessor instance and run:

```
aws lambda invoke --function-name crossfeed-prod-pesyncdb --log-type Tail --region us-east-1 /dev/stderr --query 'LogResult' --output text | base64 -d
```

## Accessing the database

### Connect to python environment

```
pyenv activate pe-reports
```

### Get database credentials

Retrieve the database credentials by running the following command in the terraformer instance:

```
aws ssm get-parameter --name "/crossfeed/staging/DATABASE_HOST" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_NAME" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_USER" --with-decryption
aws ssm get-parameter --name "/crossfeed/staging/PE_DB_PASSWORD" --with-decryption
```

You can use these credentials when connecting to the database.

You may have to specify the correct AWS profile if you have multiple:

```
export AWS_DEFAULT_PROFILE=
```

### Connect to the database with psql

```
psql -d [pe database name] -U [pe database user] -h [database host] -W
```

Then enter pe database password.

Follow this link for psql command basics:
https://www.postgresqltutorial.com/psql-commands/

## Populate the database with pg dump file

Locate the latest postgres dump file and run:

```
pg_restore -U pe -d pe "[path to sql dump file]"
```
