import traceback
from sixgill.source import (
    alerts,
    list_organizations,
    alias_organization,
    mentions,
    root_domains,
    creds,
    top_cves,
)
import psycopg2
import psycopg2.extras as extras
import os
import pandas as pd
import json
import datetime
from datetime import date, timedelta
import requests

DB_HOST = os.environ.get("DB_HOST")
PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

CF_DB_USERNAME = os.environ.get("DB_USERNAME")
CF_DB_NAME = os.environ.get("DB_NAME")
CF_DB_PASSWORD = os.environ.get("DB_PASSWORD")

org_id = os.environ.get("org_id")
org_name = os.environ.get("org_name")

# get todays date formatted YYYY-MM-DD and the startdate 16 days prior
today = date.today()
days_back = timedelta(days=40)
start_date = str(today - days_back)
end_date = str(today)
date_span = f"[{start_date} TO {end_date}]"


to_date = datetime.datetime.now()
back = timedelta(days=16)
from_date = (to_date - back).strftime("%Y-%m-%d %H:%M:%S")
to_date = to_date.strftime("%Y-%m-%d %H:%M:%S")
print(to_date)
print(from_date)


def cve(cveid):
    """Get CVE data."""
    url = f"https://cve.circl.lu/api/cve/{cveid}"
    resp = requests.get(url).json()
    return resp


"""Connect to PE Database"""
try:
    PE_conn = psycopg2.connect(
        host=DB_HOST,
        database=PE_DB_NAME,
        user=PE_DB_USERNAME,
        password=PE_DB_PASSWORD,
    )
    print("Connected to PE database.")
except:
    print("Failed connecting to PE database.")

"""Select organization from PE Database"""
try:
    print(f"Running on organization: {org_name}")
    cur = PE_conn.cursor()
    sql = f"""SELECT * FROM organizations WHERE name='{org_name}'"""
    cur.execute(sql)
    pe_org_uid = cur.fetchone()
    cur.close()
    print(f"PE_org_uid: {pe_org_uid}")
except:
    print("Failed with Select Statement")
    print(traceback.format_exc())


"""Fetch associated CyberSixGill org id"""
try:
    sixgill_orgs_df = list_organizations()
    for index, row in sixgill_orgs_df.iterrows():
        if pe_org_uid[2] == row["name"]:
            sixgill_org_id = row["organization_id"]
    if not sixgill_org_id:
        raise Exception("Sixgill cannot match an org_id")
    print(f"Sixgill_org_uid: {sixgill_org_id}")
except:
    print("Failed fetching the CyberSixGill Org Id.")
    print(traceback.format_exc())

"""Fetch Aliases from Cybersix"""
try:
    aliases = alias_organization(sixgill_org_id)
except:
    print("Failed fetching Cybersixgill aliases.")
    print(traceback.format_exc())

"""Insert/Update Aliases into PE databse instance"""
try:
    aliases_list = json.loads(aliases.replace("'", '"'))
    alias_df = pd.DataFrame(aliases_list, columns=["alias"])
    alias_df["organizations_uid"] = pe_org_uid[0]

    table = "alias"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in alias_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(alias_df.columns))
    # SQL quert to execute
    query = """INSERT INTO %s(%s) VALUES %%s
    ON CONFLICT (alias) DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(cursor, query, tuples)
        PE_conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        print(traceback.format_exc())
        PE_conn.rollback()
        cursor.close()
    print("Successfully inserted/updated alias data into PE database.")
    cursor.close()

except:
    print("Failed inserting/updating alias data.")
    print(traceback.format_exc())


"""Fetch Alert Data"""
try:
    alerts_df = alerts(sixgill_org_id)
    # add associated pe org_id
    alerts_df["organizations_uid"] = pe_org_uid[0]
    # rename columns
    alerts_df = alerts_df.rename(columns={"id": "sixgill_id"})

except:
    print("Failed fetching Alert data.")
    print(traceback.format_exc())

"""Insert Alert data into PE database instance."""
try:
    alerts_df = alerts_df.drop(columns=["sub_alerts", "langcode"])
    table = "alerts"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in alerts_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(alerts_df.columns))
    # SQL quert to execute
    query = """INSERT INTO %s(%s) VALUES %%s
    ON CONFLICT (sixgill_id) DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(cursor, query, tuples)
        PE_conn.commit()
        print("Successfully inserted/updated alert data into PE database.")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        print(traceback.format_exc())
        PE_conn.rollback()
        cursor.close()
    cursor.close()
except:
    print("Failed inserting alert data into PE database.")
    print(traceback.format_exc())


"""Fetch Mention Data"""
try:
    # call mentions function
    mentions_df = mentions(date_span, aliases)
    # rename columns
    mentions_df = mentions_df.rename(columns={"id": "sixgill_mention_id"})
    # drop unneeded columns (errors = "ignore" adds drop "if exists" functionality)
    mentions_df = mentions_df.drop(
        columns=[
            "images",
            "language",
            "length",
            "financial",
            "ips",
            "pds",
            "malware",
            "content_trimmed",
            "hash",
        ],
        errors="ignore",
    )
    # add associated pe org_id
    mentions_df["organizations_uid"] = pe_org_uid[0]
except:
    print("Failed fetching mention data.")
    print(traceback.format_exc())

"""Insert mention data into PE database instance."""
try:
    table = "mentions"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in mentions_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(mentions_df.columns))
    # SQL quert to execute
    query = """INSERT INTO %s(%s) VALUES %%s
    ON CONFLICT (sixgill_mention_id) DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(cursor, query, tuples)
        PE_conn.commit()
        print("Successfully inserted/updated mention data into PE database.")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        print(traceback.format_exc())
        PE_conn.rollback()
        cursor.close()
    cursor.close()
except:
    print("Failed inserting mention data into PE database.")
    print(traceback.format_exc())


"""Fetch Top CVE data"""
try:
    top_cve_df = top_cves(10)
    top_cve_df["date"] = end_date
    top_cve_df["nvd_base_score"] = top_cve_df["nvd_base_score"].astype("str")
    # Get CVE description from circl.lu
    top_cve_df["summary"] = ""
    for index, row in top_cve_df.iterrows():
        try:
            resp = cve(row["cve_id"])
            summary = resp["summary"]
        except:
            summary = ""
        top_cve_df.at[index, "summary"] = summary
    print("Successfully fetched top cve data.")

except:
    print("Failed fetching top cve data.")
    print(traceback.format_exc())

"""Insert Top CVE Data into PE database"""
try:
    table = "top_cves"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in top_cve_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(top_cve_df.columns))
    # SQL quert to execute
    query = """INSERT INTO %s(%s) VALUES %%s
    ON CONFLICT (cve_id, date) DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(cursor, query, tuples)
        PE_conn.commit()
        print("Successfully inserted/updated top cve data into PE database.")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        print(traceback.format_exc())
        PE_conn.rollback()
        cursor.close()
    cursor.close()
except:
    print("Failed inserting top cve data into PE database.")
    print(traceback.format_exc())


"""Fetch root domains for Credential function"""
try:
    root_domains = root_domains(sixgill_org_id)
    root_domains = json.loads(root_domains.replace("'", '"'))
except:
    print("Failed fetching root domain data.")
    print(traceback.format_exc())

"""Fetch Credential Data"""
try:
    creds_df = creds(root_domains, from_date, to_date)
    creds_df["organizations_uid"] = pe_org_uid[0]
    print("Successfully fetched credential data.")
except:
    print("Failed fetching credential data.")
    print(traceback.format_exc())

"""Insert Credential Data in PE database"""
try:
    table = "cybersix_exposed_credentials"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in creds_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(creds_df.columns))
    # SQL quert to execute
    query = """INSERT INTO %s(%s) VALUES %%s
    ON CONFLICT (breach_id, email) DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(cursor, query, tuples)
        PE_conn.commit()
        print("Successfully inserted/updated exposed credentials into PE database.")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        print(traceback.format_exc())
        PE_conn.rollback()
        cursor.close()
    cursor.close()
except:
    print("Failed inserting exposed credentials into PE database.")
    print(traceback.format_exc())

PE_conn.close()
