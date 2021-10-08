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
from datetime import date, timedelta

"""
TODO: Make sure we are getting all results for each table
TODO: Configure top cve/credential inserts
"""
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
days_back = timedelta(days=16)
start_date = str(today - days_back)
end_date = str(today)
date_span = f"[{start_date} TO {end_date}]"


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
    print(mentions_df)
    # rename columns
    mentions_df = mentions_df.rename(columns={"id": "sixgill_mention_id"})
    # drop unneeded columns (errors = "ignore" adds drop "if exists" functionality)
    mentions_df = mentions_df.drop(
        columns=["images", "language", "length", "financial", "ips", "pds", "malware"],
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


# """Fetch Top CVE data"""
# try:
#     top_cves(10)
# except:
#     print("Failed fetching top cve data.")
#     print(traceback.format_exc())
"""Insert Rope CVE Data into PE database"""
# TODO: Once API is up and running, configure top cve data into PE credential table

# """Fetch root domains for Credential function"""
# try:
#     root_domains = root_domains(sixgill_org_id)
#     root_domains = json.loads(root_domains.replace("'", '"'))
#     print(root_domains)
# except:
#     print("Failed fetching root domain data.")
#     print(traceback.format_exc())

# """Fetch Credential Data"""
# try:
#     list = []
#     for domain in root_domains:
#         print(domain)
#         print(start_date)
#         print(end_date)
#         list.append(domain)
#         print(list)
#         creds_df = creds(list)
#         break
# except:
#     print("Failed fetching credential data.")
#     print(traceback.format_exc())

"""Inert Credential Data in PE database"""
# TODO: Once API is up and running, configure credential data into PE credential table
PE_conn.close()
