#!/bin/bash

set -e
set -u

psql -v ON_ERROR_STOP=1 --username "$DB_USERNAME" <<-EOSQL
    CREATE DATABASE crossfeed_test;
    GRANT ALL PRIVILEGES ON DATABASE crossfeed_test TO $DB_USERNAME;
EOSQL