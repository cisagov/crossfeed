from concurrent.futures import thread
import pandas.io.sql as sqlio
import psycopg2
from psycopg2 import OperationalError
import psycopg2.extras as extras
import sys
import pandas as pd
import os
from datetime import datetime


PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")

CF_DB_NAME = os.environ.get("DB_NAME")
CF_DB_USERNAME = os.environ.get("DB_USERNAME")
CF_DB_PASSWORD = os.environ.get("DB_PASSWORD")


def show_psycopg2_exception(err):
    "Error handleing for postgres issues"
    err_type, traceback = sys.exc_info()
    line_n = traceback.tb_lineno
    print("\npsycopg2 ERROR:", err, "on line number:", line_n)
    print("psycopg2 traceback:", traceback, "-- type:", err_type)
    print("\nextensions.Diagnostics:", err)
    print("pgerror:", err)
    print("pgcode:", err, "\n")


def connect(thread):
    "Connection to postgres database"
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=PE_DB_NAME,
            user=PE_DB_USERNAME,
            password=PE_DB_PASSWORD,
        )
    except OperationalError as err:
        show_psycopg2_exception(err)
        conn = None
    return conn


def close(conn):
    conn.close()
    return


def get_org_id(org_name):
    try:
        conn = connect(thread)
        print(f"Running on organization: {org_name}")
        cur = conn.cursor()
        sql = f"""SELECT organizations_uid FROM organizations WHERE name=%s"""
        cur.execute(sql, (org_name,))
        pe_org_uid = cur.fetchone()[0]
        cur.close()
        print(f"PE_org_uid: {pe_org_uid}")
        close(conn)
        return pe_org_uid
    except:
        print("Failed with Select Statement")


def execute_shodan_data(dataframe, table, thread, org_name, failed):
    """Insert shodan data into db."""
    conn = connect(thread)
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    if table == "shodan_assets":
        assert [
            c
            in [
                "organizations_uid",
                "organization",
                "ip",
                "port",
                "protocol",
                "timestamp",
                "product",
                "server",
                "tags",
                "domains",
                "hostnames",
                "isn",
                "asn",
                "data_source_uid",
            ]
            for c in cols
        ]
    elif table == "shodan_insecure_protocols_unverified_vulns":
        assert [
            c
            in [
                "organizations_uid",
                "organization",
                "ip",
                "port",
                "protocol",
                "type",
                "name",
                "potential_vulns",
                "mitigation",
                "timestamp",
                "product",
                "server",
                "tags",
                "domains",
                "hostnames",
                "isn",
                "asn",
                "data_source_uid",
            ]
            for c in cols
        ]
    else:
        assert table in ["shodan_verified_vulns"]
        assert [
            c
            in [
                "organizations_uid",
                "organization",
                "ip",
                "port",
                "protocol",
                "timestamp",
                "cve",
                "severity",
                "cvss",
                "summary",
                "product",
                "attack_vector",
                "av_description",
                "attack_complexity",
                "ac_description",
                "confidentiality_impact",
                "ci_description",
                "integrity_impact",
                "ii_Description",
                "availability_impact",
                "ai_description",
                "tags",
                "domains",
                "hostnames",
                "isn",
                "asn",
                "data_source_uid",
            ]
            for c in cols
        ]
    sql = """INSERT INTO {}({}) VALUES %s
    ON CONFLICT (organizations_uid, ip, port, protocol, timestamp)
    DO NOTHING;"""
    cursor = conn.cursor()
    try:
        extras.execute_values(
            cursor,
            sql.format(
                table,
                cols,
            ),
            tpls,
        )
        conn.commit()
        print(
            f"{thread} Data inserted using execute_values() successfully - {org_name}"
        )
    except Exception as e:
        print(f"{org_name} failed inserting into {table}")
        print(f"{thread} {e} - {org_name}")
        failed.append(f"{org_name} failed inserting into {table}")
        conn.rollback()
        cursor.close()
    cursor.close()
    return failed


def query_ips(org_id):
    conn = connect("")
    sql = f"""SELECT wa.asset as ip_address
            FROM web_assets wa
            WHERE wa.organizations_uid = %s
            and wa.report_on = True
            """
    # to just return ipv4 change last line to the following:
    # and wa.asset_type = 'ipv4'
    df = pd.read_sql(sql, conn, params=(org_id,))
    conn.close()
    return df


def getDataSource(source):
    conn = connect("")
    cur = conn.cursor()
    sql = f"""SELECT * FROM data_source WHERE name=%s"""
    cur.execute(sql, (source,))
    source = cur.fetchone()
    # Update last_run in data_source table
    date = datetime.today().strftime("%Y-%m-%d")
    sql = """update data_source set last_run = %s
            where name = %s;"""
    cur.execute(
        sql,
        (
            date,
            source[1],
        ),
    )
    cur.close()
    return source
