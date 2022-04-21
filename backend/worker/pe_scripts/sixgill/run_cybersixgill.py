import traceback
try:
    from source import (
        alerts,
        list_organizations,
        alias_organization,
        mentions,
        root_domains,
        creds,
        top_cves,
    )
    from redact import redact_pii
    import psycopg2
    import psycopg2.extras as extras
    import os
    import pandas as pd
    import datetime
    from datetime import date, timedelta
    import requests
except:
    print(traceback.format_exc())

DB_HOST = os.environ.get("DB_HOST")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_USERNAME = os.environ.get("PE_DB_USERNAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")

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


def cve(cveid):
    """Get CVE data."""
    url = f"https://cve.circl.lu/api/cve/{cveid}"
    resp = requests.get(url).json()
    return resp


def getDataSource(conn, source):
    cur = conn.cursor()
    sql = """SELECT * FROM data_source WHERE name=%s"""
    cur.execute(sql, (source,))
    source = cur.fetchone()
    cur.close()
    return source


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

"""Get the Cybersixgill data source uid"""
try:
    source_uid = getDataSource(PE_conn, "Cybersixgill")
    print("Success fetching the data source")
except:
    print("Failed fetching the data source.")

"""Select organization from PE Database"""
try:
    print(f"Running on organization: {org_name}")
    cur = PE_conn.cursor()
    sql = """SELECT * FROM organizations WHERE name=%s"""
    cur.execute(sql, (org_name,))
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

"""Insert/Update Aliases into PE database instance"""
try:
    # aliases_list = json.loads(aliases.replace("'", '"'))
    alias_df = pd.DataFrame(aliases, columns=["alias"])
    alias_df["organizations_uid"] = pe_org_uid[0]

    table = "alias"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in alias_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(alias_df.columns))
    assert table in ["alias"]
    assert [c in ["alias", "organizations_uid"] for c in cols]
    # SQL quert to execute
    query = """INSERT INTO {}({}) VALUES %s
    ON CONFLICT (alias) DO NOTHING;"""
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(
            cursor,
            query.format(
                table,
                cols,
            ),
            tuples,
        )
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

""" Run redact script on Alert content and title to remove PII"""
try:
    alerts_df = redact_pii(alerts_df, ["content", "title"])
    print("Success redacting PII")
except:
    print("Something failed with the redact.")
    print(traceback.format_exc())


"""Insert Alert data into PE database instance."""
try:
    alerts_df = alerts_df.drop(
        columns=["alert_type_id", "sub_alerts", "langcode", "matched_assets"],
        errors="ignore",
    )
    alerts_df["data_source_uid"] = source_uid[0]
    table = "alerts"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in alerts_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(alerts_df.columns))
    assert table in ["alerts"]
    assert [
        c
        in [
            "alert_name",
            "content",
            "date",
            "sixgill_id",
            "read",
            "severity",
            "site",
            "threat_level",
            "threats",
            "title",
            "user_id",
            "category",
            "lang",
            "organizations_uid",
            "data_source_uid",
        ]
        for c in cols
    ]
    # SQL quert to execute
    query = """INSERT INTO {}({}) VALUES %s
    ON CONFLICT (sixgill_id) DO NOTHING;"""
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(
            cursor,
            query.format(
                table,
                cols,
            ),
            tuples,
        )
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

    try:
        mentions_df = mentions_df[
            [
                "category",
                "collection_date",
                "content",
                "creator",
                "date",
                "sixgill_mention_id",
                "lang",
                "post_id",
                "rep_grade",
                "site",
                "site_grade",
                "sub_category",
                "title",
                "type",
                "url",
                "comments_count",
                "tags",
            ]
        ]
    except:
        try:
            mentions_df = mentions_df[
                [
                    "category",
                    "collection_date",
                    "content",
                    "creator",
                    "date",
                    "sixgill_mention_id",
                    "lang",
                    "post_id",
                    "rep_grade",
                    "site",
                    "site_grade",
                    "sub_category",
                    "title",
                    "type",
                    "url",
                    "comments_count",
                ]
            ]
        except:
            mentions_df = mentions_df[
                [
                    "category",
                    "collection_date",
                    "content",
                    "creator",
                    "date",
                    "sixgill_mention_id",
                    "lang",
                    "post_id",
                    "rep_grade",
                    "site",
                    "site_grade",
                    "title",
                    "type",
                    "url",
                ]
            ]

    # add associated pe org_id
    mentions_df["organizations_uid"] = pe_org_uid[0]
except:
    print("Failed fetching mention data.")
    print(traceback.format_exc())

""" Run redact script on Mention content and title to remove PII"""
try:
    # Make sure both columns are strings
    mentions_df.loc[:, "title"] = str(mentions_df["title"])
    mentions_df.loc[:, "content"] = str(mentions_df["content"])
    # Run redact script
    mentions_df = redact_pii(mentions_df, ["content", "title"])
    print("Success redacting PII")
except:
    print("Something failed with the redact.")
    print(traceback.format_exc())


"""Insert mention data into PE database instance."""
try:
    mentions_df = mentions_df.apply(
        lambda col: col.str.replace(r"[\x00|NULL]", "") if col.dtype == object else col
    )
    mentions_df["data_source_uid"] = source_uid[0]
    table = "mentions"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in mentions_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(mentions_df.columns))
    assert table in ["mentions"]
    assert [
        c
        in [
            "category",
            "collection_date",
            "content",
            "creator",
            "date",
            "sixgill_mention_id",
            "lang",
            "post_id",
            "rep_grade",
            "site",
            "site_grade",
            "sub_category",
            "title",
            "type",
            "url",
            "comments_count",
            "tags",
            "organizations_uid",
            "data_source_uid",
        ]
        for c in cols
    ]
    # SQL quert to execute
    query = """INSERT INTO {}({}) VALUES %s
    ON CONFLICT (sixgill_mention_id) DO NOTHING;"""
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(
            cursor,
            query.format(
                table,
                cols,
            ),
            tuples,
        )
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
    top_cve_df["data_source_uid"] = source_uid[0]
    table = "top_cves"
    # Create a list of tupples from the dataframe values
    tuples = [tuple(x) for x in top_cve_df.to_numpy()]
    # Comma-separated dataframe columns
    cols = ",".join(list(top_cve_df.columns))
    assert table in ["top_cves"]
    assert [
        c
        in [
            "cve_id",
            "dynamic_rating",
            "nvd_base_score",
            "date",
            "summary",
            "data_source_uid",
        ]
        for c in cols
    ]
    # SQL query to execute
    query = """INSERT INTO {}({}) VALUES %s
    ON CONFLICT (cve_id, date) DO NOTHING;"""
    cursor = PE_conn.cursor()
    try:
        extras.execute_values(
            cursor,
            query.format(
                table,
                cols,
            ),
            tuples,
        )
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
    # root_domains = json.loads(root_domains.replace("'", '"'))
except:
    print("Failed fetching root domain data.")
    print(traceback.format_exc())

"""Fetch Credential Data"""
try:
    creds_df = creds(root_domains, from_date, to_date)
    creds_df["organizations_uid"] = pe_org_uid[0]
    creds_df["data_source_uid"] = source_uid[0]
    print("Successfully fetched credential data.")
except:
    print("Failed fetching credential data.")
    print(traceback.format_exc())

if not creds_df.empty:
    """Split credential data into breach and credential tables"""
    try:
        # Change empty and ambiguous breach names
        creds_df.loc[
            creds_df["breach_name"] == "", "breach_name"
        ] = "Cybersixgill_" + creds_df["breach_id"].astype(str)

        creds_df.loc[
            creds_df["breach_name"] == "Automatic leaked credentials detection",
            "breach_name",
        ] = "Cybersixgill_" + creds_df["breach_id"].astype(str)
        creds_breach_df = creds_df[
            ["breach_name", "description", "breach_date", "password", "data_source_uid"]
        ].reset_index()

        # Create password_included column
        creds_breach_df["password_included"] = creds_breach_df["password"] != ""

        # Group breaches and count the number of credentials
        count_creds = creds_breach_df.groupby(
            [
                "breach_name",
                "description",
                "breach_date",
                "password_included",
                "data_source_uid",
            ]
        ).size()
        creds_breach_df = count_creds.to_frame(name="exposed_cred_count").reset_index()
        creds_breach_df["modified_date"] = creds_breach_df["breach_date"]
    except:
        print("Failed splitting credential data.")
        print(traceback.format_exc())

    # Insert breach data into the PE database
    try:
        table = "credential_breaches"
        # Create a list of tuples from the dataframe values
        tuples = [tuple(x) for x in creds_breach_df.to_numpy()]
        # Comma-separated dataframe columns
        cols = ",".join(list(creds_breach_df.columns))
        assert table in ["credential_breaches"]
        assert [
            c
            in [
                "breach_name",
                "description",
                "breach_date",
                "password_included",
                "data_source_uid",
                "exposed_cred_count",
                "modified_date",
            ]
            for c in cols
        ]
        # SQL query to execute
        query = """INSERT INTO {}({}) VALUES %s
        ON CONFLICT (breach_name) DO UPDATE SET
        exposed_cred_count = EXCLUDED.exposed_cred_count,
        password_included = EXCLUDED.password_included;"""
        cursor = PE_conn.cursor()
        try:
            extras.execute_values(
                cursor,
                query.format(
                    table,
                    cols,
                ),
                tuples,
            )
            PE_conn.commit()
            print("Successfully inserted/updated breaches into PE database.")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            PE_conn.rollback()
        cursor.close()
    except Exception as e:
        print(f"Failed inserting breaches for {org_id}")
        print(e)

    # Get breach uids and match to credentials
    try:
        cur = PE_conn.cursor()
        sql = """SELECT breach_name, credential_breaches_uid FROM credential_breaches"""
        cur.execute(sql)
        pe_orgs = cur.fetchall()
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"There was a problem with your database query {error}")

    breach_dict = dict(pe_orgs)
    for i, row in creds_df.iterrows():
        breach_uid = breach_dict[row["breach_name"]]
        creds_df.at[i, "credential_breaches_uid"] = breach_uid

    # Insert credential data into the PE database
    creds_df = creds_df.rename(
        columns={"domain": "sub_domain", "breach_date": "modified_date"}
    )
    creds_df = creds_df[
        [
            "modified_date",
            "sub_domain",
            "email",
            "hash_type",
            "name",
            "login_id",
            "password",
            "phone",
            "breach_name",
            "organizations_uid",
            "data_source_uid",
            "credential_breaches_uid",
        ]
    ]

    """Insert Credential Data in PE database"""
    try:
        table = "credential_exposures"
        # Create a list of tuples from the dataframe values
        tuples = [tuple(x) for x in creds_df.to_numpy()]
        # Comma-separated dataframe columns
        cols = ",".join(list(creds_df.columns))
        assert table in ["credential_exposures"]
        assert [
            c
            in [
                "modified_date",
                "sub_domain",
                "email",
                "hash_type",
                "name",
                "login_id",
                "password",
                "phone",
                "breach_name",
                "organizations_uid",
                "data_source_uid",
                "credential_breaches_uid",
            ]
            for c in cols
        ]
        # SQL query to execute
        query = """INSERT INTO {}({}) VALUES %s
        ON CONFLICT (breach_name, email, name) DO UPDATE SET
        modified_date = EXCLUDED.modified_date;;"""
        cursor = PE_conn.cursor()
        try:
            extras.execute_values(
                cursor,
                query.format(
                    table,
                    cols,
                ),
                tuples,
            )
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
else:
    print("No credentials found")

PE_conn.close()
