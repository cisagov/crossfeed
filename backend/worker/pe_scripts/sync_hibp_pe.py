import os
import traceback
import psycopg2
import psycopg2.extras as extras
from psycopg2 import OperationalError
import pandas as pd
import json

DB_HOST = os.environ.get("DB_HOST")
PE_DB_USERNAME =os.environ.get("PE_DB_USERNAME")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

CF_DB_USERNAME =os.environ.get("DB_USERNAME")
CF_DB_NAME = os.environ.get("DB_NAME")
CF_DB_PASSWORD = os.environ.get("DB_PASSWORD")

org_id = os.environ.get("org_id")
org_name = os.environ.get("org_name")

def connect(host, database, user, password):
    conn = psycopg2.connect(host= host, database= database, user = user, password=password)
    return conn

def query_db(conn, query, args=(), one=False):
    cur = conn.cursor()
    cur.execute(query, args)
    r = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    
    return (r[0] if r else None) if one else r

def execute_hibp_breach_values(conn, jsonList, table):
    "SQL 'INSERT' of a datafame"
    columns = jsonList[0].keys()
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (breach_name) 
    DO UPDATE SET modified_date = EXCLUDED.modified_date,
    exposed_cred_count = EXCLUDED.exposed_cred_count,
    password_included = EXCLUDED.password_included;""" % (table, ','.join(columns))
    values = [[value for value in dict.values()] for dict in jsonList]
    cursor = conn.cursor()
    try:
        extras.execute_values(cursor, sql, values)
        conn.commit()
        print("Data inserted using execute_values() successfully..")
    except (Exception, psycopg2.DatabaseError) as err:
        print(err)
        cursor.close()

def execute_hibp_emails_values(conn, jsonList, table):
    "SQL 'INSERT' of a datafame"
    columns = jsonList[0].keys()
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (email, breach_name) 
    DO NOTHING;""" % (table, ','.join(columns))
    values = [[value for value in dict.values()] for dict in jsonList]
    cursor = conn.cursor()
    # try:
    extras.execute_values(cursor, sql, values)
    conn.commit()
    print("Data inserted using execute_values() successfully..")
    # except (Exception, psycopg2.DatabaseError) as err:
    #     show_psycopg2_exception(err)
    #     cursor.close()

try:
    try:
        PE_conn = connect(DB_HOST,PE_DB_NAME,PE_DB_USERNAME,PE_DB_PASSWORD)
        print("Connected to PE database.")
    except:
        print("Failed To Connect to PE database")

    # Currently don't have orgs loaded in my DB to test with
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

    try:
        CF_conn = connect(DB_HOST,CF_DB_NAME,CF_DB_USERNAME,CF_DB_PASSWORD)
        print("Connected to crossfeed database.")
    except:
        print("Failed To Connect to crossfeed database")

    try:
        sql = f"""SELECT vuln."structuredData", dom."fromRootDomain", dom."name"
                FROM domain as dom
                JOIN vulnerability as vuln 
                ON vuln."domainId" = dom.id 
                WHERE dom."organizationId" ='{org_id}' 
                AND vuln."source" = 'hibp'"""

        hibp_resp = query_db(CF_conn, sql,)
        # json_output = json.dumps(my_query)
        compiled_breaches = {}
        for row in hibp_resp:
            compiled_breaches.update(row['structuredData']['breaches'])
        b_list = []
        for breach in compiled_breaches.values():
            breach_dict = {
                "breach_name": breach['Name'],
                "description": breach['Description'],
                "exposed_cred_count": breach['PwnCount'],
                "breach_date": breach['BreachDate'],
                "added_date": breach['AddedDate'],
                "modified_date": breach['ModifiedDate'],
                "data_classes": breach['DataClasses'],
                "password_included": breach['passwordIncluded'],
                "is_verified": breach['IsVerified'],
                "is_fabricated": breach['IsFabricated'],
                "is_sensitive": breach['IsSensitive'],
                "is_retired": breach['IsRetired'],
                "is_spam_list": breach['IsSpamList'],
            }
            b_list.append(breach_dict)
        execute_hibp_breach_values(PE_conn, b_list,"public.hibp_breaches")
        sql = """SELECT breach."breach_name", breach."hibp_breaches_uid" from public.hibp_breaches as breach"""
        breaches_UIDs = query_db(PE_conn,sql)
        print(breaches_UIDs)
        breach_UIDS_Dict = {}
        for UID in breaches_UIDs:
            breach_UIDS_Dict.update({UID['breach_name']:UID['hibp_breaches_uid']})
        print(breach_UIDS_Dict)
        creds_list= []
        for row in hibp_resp:
            breaches = row['structuredData']['breaches']
            emails = row['structuredData']['emails']
            for email, breach_list in emails.items():
                subdomain = row['name']
                root_domain = row['fromRootDomain']
                for b in breach_list:
                    cred = {
                        'email':email ,
                        'organizations_uid': pe_org_uid,
                        'root_domain': root_domain,
                        'sub_domain': subdomain,
                        'modified_date':compiled_breaches[b]['ModifiedDate'],
                        'breach_name': b,
                        'breach_id': breach_UIDS_Dict[b]
                    }
                    creds_list.append(cred)
        print("there are ",len(creds_list), " creds found")
        execute_hibp_emails_values(PE_conn,creds_list,"public.hibp_exposed_credentials")
        PE_conn.close()
        CF_conn.close()
                
    except:
        print(traceback.format_exc())
        print("failed to query crossfeed db")

    

except:
    print("Failed")