from concurrent.futures import thread
import pandas.io.sql as sqlio
import psycopg2
from psycopg2 import OperationalError
import psycopg2.extras as extras
import sys
import pandas as pd
import os
import datetime

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


def execute_values(conn, dataframe, table, except_condition=";"):
    "SQL 'INSERT' of a datafame"
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = "INSERT INTO %s(%s) VALUES %%s" % (table, cols)
    sql = sql + except_condition
    cursor = conn.cursor()
    try:
        extras.execute_values(cursor, sql, tpls)
        conn.commit()
        print("Data inserted using execute_values() successfully..")
    except (Exception, psycopg2.DatabaseError) as err:
        show_psycopg2_exception(err)
        cursor.close()


def query_values(conn, table, where=";"):
    """SQL 'SELECT' of a datafame"""
    sql = "SELECT * FROM " + table
    sql = sql + where
    # try just pandas... pd..read_sql_query(sql, conn)
    df = pd.read_sql_query(sql, conn)
    conn.close()
    return df


def query_orgs(thread):
    conn = connect(thread)
    orgs = query_values(conn, "organizations")
    close(conn)
    print(orgs)
    return orgs


def get_org_id(org_name):
    try:
        conn = connect(thread)
        print(f"Running on organization: {org_name}")
        cur = conn.cursor()
        sql = f"""SELECT organizations_uid FROM organizations WHERE name='{org_name}'"""
        cur.execute(sql)
        pe_org_uid = cur.fetchone()[0]
        cur.close()
        print(f"PE_org_uid: {pe_org_uid}")
        close(conn)
        return pe_org_uid
    except:
        print("Failed with Select Statement")


def query_roots(conn, org_uid):
    """SQL 'SELECT' of a datafame"""
    sql = f"SELECT * FROM root_domains WHERE organizations_uid = '{org_uid}'"
    # try just pandas... pd..read_sql_query(sql, conn)
    df = pd.read_sql_query(sql, conn)
    return df


def query_null_roots(conn, org_uid):
    """SQL 'SELECT' of a datafame"""
    sql = f"SELECT * FROM root_domains WHERE root_domain = 'Null_Root'"
    # try just pandas... pd..read_sql_query(sql, conn)
    df = pd.read_sql_query(sql, conn)
    return df


def execute_hibp_breach_values(conn, dataframe, table):
    "SQL 'INSERT' of a datafame"
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (breach_name) 
    DO UPDATE SET modified_date = EXCLUDED.modified_date;""" % (
        table,
        cols,
    )
    cursor = conn.cursor()
    try:
        extras.execute_values(cursor, sql, tpls)
        conn.commit()
        print("Data inserted using execute_values() successfully..")
    except (Exception, psycopg2.DatabaseError) as err:
        show_psycopg2_exception(err)
        cursor.close()


def execute_hibp_emails_values(conn, dataframe, table):
    "SQL 'INSERT' of a datafame"
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (email, breach_name) 
    DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = conn.cursor()
    try:
        extras.execute_values(cursor, sql, tpls)
        conn.commit()
        print("Data inserted using execute_values() successfully..")
    except (Exception, psycopg2.DatabaseError) as err:
        show_psycopg2_exception(err)
        cursor.close()


def query_null_subs(conn):
    """SQL 'SELECT' of a datafame"""
    sql = """SELECT o.name, o.organizations_uid, rd.root_domain, rd.root_domain_uid, sd.sub_domain, sd.sub_domain_uid FROM sub_domains as sd 
    JOIN root_domains as rd ON sd.root_domain_uid = rd.root_domain_uid
    JOIN organizations as o ON o.organizations_uid = rd.organizations_uid
    WHERE sub_domain = 'Null_Sub'"""
    # try just pandas... pd..read_sql_query(sql, conn)
    df = pd.read_sql_query(sql, conn)
    return df


def execute_shodan_data(dataframe, table, thread, org_name, failed):
    """Insert shodan data into db."""
    conn = connect(thread)
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
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


def execute_dnsmonitor_data(dataframe, table):
    conn = connect("")
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (domain_permutation) 
    DO UPDATE SET ipv4 = EXCLUDED.ipv4,
        ipv6 = EXCLUDED.ipv6,
        date_observed = EXCLUDED.date_observed,
        mail_server = EXCLUDED.mail_server,
        name_server = EXCLUDED.name_server,
        sub_domain_uid = EXCLUDED.sub_domain_uid,
        data_source_uid = EXCLUDED.data_source_uid;""" % (
        table,
        cols,
    )
    cursor = conn.cursor()
    extras.execute_values(cursor, sql, tpls)
    conn.commit()
    print(f"DNSMonitor Data inserted using execute_values() successfully..")


def execute_dnsmonitor_alert_data(dataframe, table):
    conn = connect("")
    tpls = [tuple(x) for x in dataframe.to_numpy()]
    cols = ",".join(list(dataframe.columns))
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (alert_type, sub_domain_uid, date, new_value) 
    DO NOTHING;""" % (
        table,
        cols,
    )
    cursor = conn.cursor()
    extras.execute_values(cursor, sql, tpls)
    conn.commit()
    print(f"DNSMonitor Alert Data inserted using execute_values() successfully..")


def query_ips(org_id):
    conn = connect("")
    sql = f"""SELECT wa.asset as ip_address
            FROM web_assets wa
            WHERE wa.organizations_uid = '{org_id}'
            and wa.report_on = True
            """
    # to just return ipv4 change last line to the following:
    # and wa.asset_type = 'ipv4'
    df = pd.read_sql(sql, conn)
    conn.close()
    return df


def query_orgs_rev():
    conn = connect()
    sql = "SELECT * FROM organizations ORDER BY organizations_uid DESC;"
    df = pd.read_sql_query(sql, conn)
    close(conn)
    return df


def query_web_assets(conn, org_id):
    sql = f"""SELECT o.name, o.organizations_uid, wa.asset_type, wa.asset, wa.ip_type,
    wa.asset_origin, wa.report_on, wa.last_scanned
    FROM web_assets as wa
    JOIN organizations o on o.organizations_uid = wa.organizations_uid
    WHERE wa.report_on = True
    and o.organizations_uid = '{org_id}'
    """
    df = pd.read_sql(sql, conn)

    conn.close()
    return df


def check_ip(ip):
    conn = connect("")
    sql = f"""SELECT wa.asset as ip, o.name as org FROM web_assets wa
    JOIN organizations o on o.organizations_uid = wa.organizations_uid
    WHERE wa.asset = '{ip}'"""
    df = pd.read_sql_query(sql, conn)
    close(conn)
    return df


def getSubdomain(domain):
    conn = connect("")
    cur = conn.cursor()
    sql = f"""SELECT * FROM sub_domains sd
        WHERE sd.sub_domain = '{domain}'"""
    cur.execute(sql)
    sub = cur.fetchone()
    cur.close()
    return sub


def getRootdomain(domain):
    conn = connect("")
    cur = conn.cursor()
    sql = f"""SELECT * FROM root_domains rd
        WHERE rd.root_domain = '{domain}'"""
    cur.execute(sql)
    root = cur.fetchone()
    cur.close()
    return root


def addRootToSubdomain(domain):
    root_domain_uid = getRootdomain(domain)[0]
    conn = connect("")
    sql = f"""insert into sub_domains(sub_domain, root_domain_uid, root_domain)
            values ('{domain}', '{root_domain_uid}', '{domain}');"""
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    close(conn)
    print(f"Success adding root domain, {domain}, to subdomains table.")


def getDataSource(source):
    conn = connect("")
    cur = conn.cursor()
    sql = f"""SELECT * FROM data_source WHERE name='{source}'"""
    cur.execute(sql)
    source = cur.fetchone()
    # Update last_run in data_source table
    date = datetime.today().strftime("%Y-%m-%d")
    sql = """update data_source set last_run = '{}'
            where name = '{}';"""
    cur.execute(sql.format(date, source))
    cur.close()
    return source
