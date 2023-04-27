import trustymail
import logging
import psycopg2
import psycopg2.extras as extras
import os
import pandas as pd
import datetime
from datetime import date, timedelta
import requests
import traceback


print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
print("I'm printing a working statement")
print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

try:
    DB_HOST = os.environ.get("DB_HOST")
    PE_DB_NAME = os.environ.get("PE_DB_NAME")
    PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
    PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

    org_id = os.environ.get("org_id")
    org_name = os.environ.get("org_name")

    print("==============================")
    print("Org ID: " + str(org_id))
    print("Org Name: " + str(org_name))
    print("==============================")

except Exception as e:
    print(e)
    print(traceback.format_exc())
