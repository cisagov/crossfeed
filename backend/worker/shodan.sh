#!/bin/bash

set -e

cd /app/pe-reports

echo "Starting Shodan"

pe-source shodan --orgs=DHS --soc_med_included

echo "Done"