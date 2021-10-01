import os
import psycopg2
import psycopg2.extras as extras
import pandas as pd

PE_DB_USER = os.environ.get("PE_DB_USER")
DB_HOST = os.environ.get("DB_HOST")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

try:
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=PE_DB_NAME, user=PE_DB_USER, password=PE_DB_PASSWORD
        )
        print("Connected to PE database.")
    except:
        print("Not able to connect")

    try:
        sql = """SELECT * FROM organizations WHERE name='Department of Homeland Security'"""
        df = pd.read_sql(sql, conn)
        df["name"] = "THis is a test Org"

        tpls = [tuple(x) for x in df.to_numpy()]
        cols = ",".join(list(df.columns))
        sql = "INSERT INTO %s(%s) VALUES %%s" % ("organizations", cols)
        cursor = conn.cursor()
        extras.execute_values(cursor, sql, tpls)
        conn.commit()
        print("Data inserted using execute_values() successfully..")
        cursor.cursor.close()
    except:
        print("fail")

    conn.close()
except:
    print("fail")
