import os
import traceback
import psycopg2
import psycopg2.extras as extras
import requests


def query_db(conn, query, args=(), one=False):
    cur = conn.cursor()
    cur.execute(query, args)
    r = [
        dict((cur.description[i][0], value) for i, value in enumerate(row))
        for row in cur.fetchall()
    ]

    return (r[0] if r else None) if one else r


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
    PE_conn = psycopg2.connect(
        host=DB_HOST, database=PE_DB_NAME, user=PE_DB_USERNAME, password=PE_DB_PASSWORD
    )
    print("Connected to PE database.")
except:
    print("Failed connecting to PE database.")

"""Select organization from PE Database"""
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


"""Connect to Crossfeed's Database"""
try:
    CF_conn = psycopg2.connect(
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
    dnstwist_resp = query_db(CF_conn, sql)

    domain_list = []
    for row in dnstwist_resp:
        row = row["structuredData"]["domains"]
        for dom in row:
            malicious = False
            attacks = 0
            reports = 0
            if "original" in dom["fuzzer"]:
                continue
            if "dns-a" not in dom:
                continue
            else:
                # check IP in Blocklist API
                response = requests.get(
                    "http://api.blocklist.de/api.php?ip=" + str(dom["dns-a"][0])
                ).content

                if str(response) != "b'attacks: 0<br />reports: 0<br />'":
                    malicious = True
                    attacks = int(str(response).split("attacks: ")[1].split("<")[0])
                    reports = int(str(response).split("reports: ")[1].split("<")[0])
            if "ssdeep-score" not in dom:
                dom["ssdeep-score"] = ""
            if "dns-mx" not in dom:
                dom["dns-mx"] = [""]
            if "dns-ns" not in dom:
                dom["dns-ns"] = [""]
            if "dns-aaaa" not in dom:
                dom["dns-aaaa"] = [""]
            else:
                # check IP in Blocklist API
                response = requests.get(
                    "http://api.blocklist.de/api.php?ip=" + str(dom["dns-aaaa"][0])
                ).content
                if str(response) != "b'attacks: 0<br />reports: 0<br />'":
                    malicious = True
                    attacks = int(str(response).split("attacks: ")[1].split("<")[0])
                    reports = int(str(response).split("reports: ")[1].split("<")[0])

            domain_dict = {
                "organizations_uid": pe_org_uid,
                "domain_permutation": dom["domain-name"],
                "ipv4": dom["dns-a"][0],
                "ipv6": dom["dns-aaaa"][0],
                "mail_server": dom["dns-mx"][0],
                "name_server": dom["dns-ns"][0],
                "fuzzer": dom["fuzzer"],
                "date_observed": dom["date-first-observed"],
                "ssdeep_score": dom["ssdeep-score"],
                "malicious": malicious,
                "blocklist_attack_count": attacks,
                "blocklist_report_count": reports,
            }
            domain_list.append(domain_dict)

except:
    print("Failed selecting DNSTwist data.")
    print(traceback.format_exc())

CF_conn.close()

"""Insert cleaned data into PE database."""
try:
    cursor = PE_conn.cursor()
    columns = domain_list[0].keys()
    table = "dnstwist_domain_masq"
    sql = """INSERT INTO %s(%s) VALUES %%s 
    ON CONFLICT (domain_permutation) 
    DO UPDATE SET malicious = EXCLUDED.malicious,
        blocklist_attack_count = EXCLUDED.blocklist_attack_count,
        blocklist_report_count = EXCLUDED.blocklist_report_count;""" % (
        table,
        ",".join(columns),
    )
    values = [[value for value in dict.values()] for dict in domain_list]
    extras.execute_values(cursor, sql, values)
    PE_conn.commit()
    print("Data inserted using execute_values() successfully..")

except:
    print("Failure inserting data into database.")
    print(traceback.format_exc())


PE_conn.close()
