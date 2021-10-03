import os
import traceback
import psycopg2
import psycopg2.extras as extras
import pandas as pd

# TODO: How often will we run this? Clear the db and readd each time or append (take out duplicates)
# or check for duplicates before appending. Worth discussion

# TODO: Create functions to clean up and improve readability

DB_HOST = os.environ.get("DB_HOST")

CF_DB_NAME = os.environ.get("DB_NAME")
CF_DB_USERNAME = os.environ.get("DB_USERNAME")
CF_DB_PASSWORD = os.environ.get("DB_PASSWORD")

PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

org_id = os.environ.get("org_id")
org_name = os.environ.get("org_name")


"""Connect to PE Database"""
try:
    conn = psycopg2.connect(
        host=DB_HOST, database=PE_DB_NAME, user=PE_DB_USERNAME, password=PE_DB_PASSWORD
    )
    print("Connected to PE database.")
except:
    print("Failed connecting to PE database.")

"""Select organization from PE Database"""
try:
    print(f"Running on organization: {org_name}")
    cur = conn.cursor()
    sql = f"""SELECT organizations_uid FROM organizations WHERE name='{org_name}'"""
    cur.execute(sql)
    pe_org_uid = cur.fetchone()[0]
    cur.close()
    print(f"PE_org_uid: {pe_org_uid}")
except:
    print("Failed with Select Statement")
    print(traceback.format_exc())

conn.close()


"""Connect to Crossfeed's Database"""
try:
    conn = psycopg2.connect(
        host=DB_HOST, database=CF_DB_NAME, user=CF_DB_USERNAME, password=CF_DB_PASSWORD
    )
    print("Connected to Crossfeed's database.")
except:
    print("Failed connecting to Crossfeed's database.")

"""Collect DNSTwist data from Crossfeed"""
try:
    sql = f"""SELECT vuln."structuredData", vuln."domainId"
                FROM domain as dom
                JOIN vulnerability as vuln
                ON vuln."domainId" = dom.id
                WHERE dom."organizationId" ='{org_id}'
                AND vuln."source" = 'dnstwist'"""
    dnstwist_df = pd.read_sql(sql, conn)
    print(dnstwist_df)

except:
    print("Failed selecting DNSTwist data.")
    print(traceback.format_exc())

"""Clean up DNSTwist data befroe inserting into PE Database"""
try:
    final_df = pd.DataFrame()
    for index, row in dnstwist_df.iterrows():
        json_data = row["structuredData"]["domains"]
        domain_df = pd.DataFrame.from_records(json_data)
        domain_df["organizations_uid"] = pe_org_uid
        domain_df["discoveredBy"] = row["domainId"]
        domain_df = domain_df.rename(columns={"date-first-observed": "date-observed"})
        print(domain_df)
        print(domain_df.columns)
        final_df = final_df.append(domain_df)
    print(final_df)
except:
    print("Failed cleaning dnstwist json")
    print(traceback.format_exc())

conn.close()

"""Insert cleaned data into PE database."""
# reconnect to pe database
# TODO: just rename the connections so we can close both at the end
try:
    conn = psycopg2.connect(
        host=DB_HOST, database=PE_DB_NAME, user=PE_DB_USERNAME, password=PE_DB_PASSWORD
    )
    print("Connected to PE database.")
except:
    print("Failed connecting to PE database.")

try:
    tpls = [tuple(x) for x in final_df.to_numpy()]
    cols = ",".join(list(final_df.columns))
    table = "DNSTwist"
    sql = "INSERT INTO %s(%s) VALUES %%s" % (table, cols)
    cursor = conn.cursor()
    extras.execute_values(cursor, sql, tpls)
    conn.commit()
    print("Data inserted using execute_values() successfully..")
    cursor.close()
except:
    print("Failure inserting data into database.")
    print(traceback.format_exc())

conn.close()
