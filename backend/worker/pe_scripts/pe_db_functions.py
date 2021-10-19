import pandas.io.sql as sqlio
import psycopg2
from psycopg2 import OperationalError
import psycopg2.extras as extras
import sys
import pandas as pd
import traceback

def show_psycopg2_exception(err):
    "Error handleing for postgres issues"
    err_type, traceback = sys.exc_info()
    line_n = traceback.tb_lineno
    print("\npsycopg2 ERROR:", err, "on line number:", line_n)
    print("psycopg2 traceback:", traceback, "-- type:", err_type)
    print("\nextensions.Diagnostics:", err)
    print("pgerror:", err)
    print("pgcode:", err, "\n")


def connect(host, database, user, password):
    "Connection to postgres database"
    conn = None
    try:
        print("[Info] Connecting to the PostgreSQL...........")
        conn = psycopg2.connect(host= host, database= database, user = user, password=password)
        print("[Info] Connection successfully..................")
        print("\n")
    except OperationalError as err:
        show_psycopg2_exception(err)
        conn = None
    return conn


def close(conn):
    conn.close()
    return

def query_ips(conn, org_id):
    sql = f"""SELECT ip.ip_address 
            FROM ip_addresses as ip
            JOIN public.sub_domains as sd 
            ON sd.sub_domain_uid = ip.sub_domain_uid
            JOIN public.root_domains AS rd
            ON rd.root_domain_uid = sd.root_domain_uid
            WHERE rd.organizations_uid = '{org_id}'
            """
    df = pd.read_sql(sql, conn)
    conn.close()
    return df

def execute_shodan_data(conn, dataframe, table):

    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (organizations_uid, ip, port, protocol, timestamp) 
    DO NOTHING;""" % (table, cols)
    cursor = conn.cursor()
    # try:
    extras.execute_values(cursor, sql, tpls)
    conn.commit()
    print("Data inserted using execute_values() successfully..")
    # except (Exception, psycopg2.DatabaseError) as err:
    #     show_psycopg2_exception(err)
    #     cursor.close()

def get_org_id(PE_conn, org_name):
    try:
            print(f"Running on organization: {org_name}")
            cur = PE_conn.cursor()
            sql = f"""SELECT organizations_uid FROM organizations WHERE name='{org_name}'"""
            cur.execute(sql)
            pe_org_uid = cur.fetchone()[0]
            cur.close()
            print(f"PE_org_uid: {pe_org_uid}")
            return pe_org_uid
    except:
        print("Failed with Select Statement")
        print(traceback.format_exc())