import os
import traceback
import psycopg2
import psycopg2.extras as extras
from psycopg2 import OperationalError
import pandas as pd
import json

DB_HOST = os.environ.get("DB_HOST")
PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

org_id = os.environ.get("org_id")
org_name = os.environ.get("org_name")
data_path = os.environ.get("data_path")


def connect(host, database, user, password):
    conn = psycopg2.connect(host=host, database=database, user=user, password=password)
    return conn


def query_db(conn, query, args=(), one=False):
    cur = conn.cursor()
    cur.execute(query, args)
    r = [
        dict((cur.description[i][0], value) for i, value in enumerate(row))
        for row in cur.fetchall()
    ]

    return (r[0] if r else None) if one else r


def execute_hibp_breach_values(conn, jsonList, table):
    "SQL 'INSERT' of a datafame"
    sql = """INSERT INTO public.credential_breaches (
        breach_name,
        description,
        exposed_cred_count,
        breach_date,
        added_date,
        modified_date,
        data_classes,
        password_included,
        is_verified,
        is_fabricated,
        is_sensitive,
        is_retired,
        is_spam_list,
        data_source_uid
    ) VALUES %s 
    ON CONFLICT (breach_name) 
    DO UPDATE SET modified_date = EXCLUDED.modified_date,
    exposed_cred_count = EXCLUDED.exposed_cred_count,
    password_included = EXCLUDED.password_included;"""
    values = [[value for value in dict.values()] for dict in jsonList]
    cursor = conn.cursor()
    try:
        extras.execute_values(cursor, sql, values)
        conn.commit()
        print("Data inserted into credential_breaches successfully..")
    except (Exception, psycopg2.DatabaseError) as err:
        print(err)
        cursor.close()


def execute_hibp_emails_values(conn, jsonList, table):
    "SQL 'INSERT' of a datafame"
    sql = """INSERT INTO public.credential_exposures (
        email,
        organizations_uid,
        root_domain,
        sub_domain,
        modified_date,
        breach_name,
        credential_breaches_uid,
        data_source_uid,
        name
    ) VALUES %s 
    ON CONFLICT (email, breach_name, name) 
    DO NOTHING;"""
    values = [[value for value in dict.values()] for dict in jsonList]
    cursor = conn.cursor()
    # try:
    extras.execute_values(cursor, sql, values)
    conn.commit()
    print("Data inserted into credential_exposures successfully..")
    # except (Exception, psycopg2.DatabaseError) as err:
    #     show_psycopg2_exception(err)
    #     cursor.close()


def getDataSource(conn, source):
    cur = conn.cursor()
    sql = f"""SELECT * FROM data_source WHERE name='{source}'"""
    cur.execute(sql)
    source = cur.fetchone()
    cur.close()
    return source


try:
    # Connect to PE DB
    try:
        PE_conn = connect(DB_HOST, PE_DB_NAME, PE_DB_USERNAME, PE_DB_PASSWORD)
        print("Connected to PE database.")
    except:
        print("Failed To Connect to PE database")

    # Query PE Db to get the Organization UID
    try:
        print(f"Running on organization: {org_name}")
        cur = PE_conn.cursor()
        sql = f"""SELECT organizations_uid FROM organizations WHERE name='{org_name}'"""
        cur.execute(sql)
        pe_org_uid = cur.fetchone()[0]
        cur.close()
        print(f"PE_org_uid: {pe_org_uid}")
    except:
        print("Failed with Select Statement")
        print(traceback.format_exc())

    # Get the Hibp data source uid
    try:
        source_uid = getDataSource(PE_conn, "HaveIBeenPwnd")[0]
        print("Success fetching the data source")
    except:
        print("Failed fetching the data source.")

    try:
        # Get a list of all HIBP Vulns for this organization
        try:
            with open(data_path, "r") as f:
                hibp_resp = json.load(f)
        except:
            print(traceback.format_exc())

        compiled_breaches = {}

        # Remove duplicate breaches
        for row in hibp_resp:
            compiled_breaches.update(row["structuredData"]["breaches"])
        # Loop through the breaches and create a breach object to insert into PE database
        b_list = []
        for breach in compiled_breaches.values():
            breach_dict = {
                "breach_name": breach["Name"],
                "description": breach["Description"],
                "exposed_cred_count": breach["PwnCount"],
                "breach_date": breach["BreachDate"],
                "added_date": breach["AddedDate"],
                "modified_date": breach["ModifiedDate"],
                "data_classes": breach["DataClasses"],
                "password_included": breach["passwordIncluded"],
                "is_verified": breach["IsVerified"],
                "is_fabricated": breach["IsFabricated"],
                "is_sensitive": breach["IsSensitive"],
                "is_retired": breach["IsRetired"],
                "is_spam_list": breach["IsSpamList"],
                "data_source_uid": source_uid,
            }
            b_list.append(breach_dict)
        # Insert new breaches into the PE DB, update changed breaches
        execute_hibp_breach_values(PE_conn, b_list, "public.credential_breaches")
        # Query PE DB for breaches to get Breach_UID
        sql = """SELECT breach."breach_name", breach."credential_breaches_uid" from public.credential_breaches as breach"""
        breaches_UIDs = query_db(PE_conn, sql)
        # Create a dictionary of each breach: UID combo
        breach_UIDS_Dict = {}
        for UID in breaches_UIDs:
            breach_UIDS_Dict.update(
                {UID["breach_name"]: UID["credential_breaches_uid"]}
            )

        # Loop through each credential exposure and create an hibp_exposed_cred object to insert into db
        creds_list = []
        for row in hibp_resp:
            breaches = row["structuredData"]["breaches"]
            emails = row["structuredData"]["emails"]
            for email, breach_list in emails.items():
                subdomain = row["name"]
                root_domain = row["fromRootDomain"]
                for b in breach_list:
                    cred = {
                        "email": email,
                        "organizations_uid": pe_org_uid,
                        "root_domain": root_domain,
                        "sub_domain": subdomain,
                        "modified_date": compiled_breaches[b]["ModifiedDate"],
                        "breach_name": b,
                        "credential_breaches_uid": breach_UIDS_Dict[b],
                        "data_source_uid": source_uid,
                        "name": None,
                    }
                    creds_list.append(cred)
        print("there are ", len(creds_list), " creds found")
        # Insert new creds into the PE DB
        execute_hibp_emails_values(PE_conn, creds_list, "public.credential_exposures")
        # Close DB connection
        PE_conn.close()

    except:
        print(traceback.format_exc())
        print("failed to query crossfeed db")


except:
    print("Failed")
