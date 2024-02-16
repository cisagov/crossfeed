#!/bin/bash

# Generate database.ini
cat <<EOF > pe-reports/src/pe_reports/data/database.ini
[postgres]
host=${DB_HOST}
database=${PE_DB_NAME}
user=${PE_DB_USERNAME}
password=${PE_DB_PASSWORD}
port=5432

[shodan]
key1=${PE_SHODAN_API_KEYS}

[hibp]
key=${HIBP_API_KEY}

[pe_api]
pe_api_key=
pe_api_url=

[staging]
[cyhy_mongo]

[sixgill]
client_id=${SIXGILL_CLIENT_ID}
client_secret=${SIXGILL_CLIENT_SECRET}

[whoisxml]
key=

[intelx]
api_key=${INTELX_API_KEY}

[dnsmonitor]
[pe_db_password_key]
[blocklist]
[dehashed]
[dnstwist]

[API_Client_ID]
[API_Client_secret]
[API_WHOIS]


EOF

# Find the path to the pe_reports package in site-packages
pe_reports_path=$(pip show pe-reports | grep -E '^Location:' | awk '{print $2}')

# Ensure pe_reports_path ends with /pe_reports
pe_reports_path="${pe_reports_path%/pe-reports}/pe_reports"

# Copy database.ini to the module's installation directory
cp /app/pe-reports/src/pe_reports/data/database.ini "${pe_reports_path}/data/"

exec "$@"