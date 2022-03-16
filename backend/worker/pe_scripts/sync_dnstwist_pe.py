import os
import traceback
import psycopg2
import psycopg2.extras as extras
import requests
import socket
import json

PE_CREDENTIALS = json.loads(os.environ.get("peCreds"))
DB_HOST = PE_CREDENTIALS["DB_HOST"]
PE_DB_NAME = PE_CREDENTIALS["PE_DB_NAME"]
PE_DB_USERNAME = PE_CREDENTIALS["PE_DB_USERNAME"]
PE_DB_PASSWORD = PE_CREDENTIALS["PE_DB_PASSWORD"]

org_name = os.environ.get("org_name")
data_path = os.environ.get("data_path")

def query_db(conn, query, args=(), one=False):
    cur = conn.cursor()
    cur.execute(query, args)
    r = [
        dict((cur.description[i][0], value) for i, value in enumerate(row))
        for row in cur.fetchall()
    ]

    return (r[0] if r else None) if one else r


def getSubdomain(conn, domain):
    cur = conn.cursor()
    sql = f"""SELECT * FROM sub_domains sd
        WHERE sd.sub_domain = '{domain}'"""
    cur.execute(sql)
    sub = cur.fetchone()
    cur.close()
    return sub


def getRootdomain(conn, domain):
    cur = conn.cursor()
    sql = f"""SELECT * FROM root_domains rd
        WHERE rd.root_domain = '{domain}'"""
    cur.execute(sql)
    root = cur.fetchone()
    cur.close()
    return root


def addRootdomain(conn, root_domain, pe_org_uid, source_uid, org_name):
    ip_address = str(socket.gethostbyname(root_domain))
    sql = f"""insert into root_domains(root_domain, organizations_uid, organization_name, data_source_uid, ip_address)
            values ('{root_domain}', '{pe_org_uid}', '{org_name}', '{source_uid}', '{ip_address}');"""
    print(sql)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    print(f"Success adding root domain, {root_domain}, to root domain table.")


def addSubdomain(conn, domain, pe_org_uid, org_name):
    source_uid = getDataSource(conn, "findomain")[0]
    root_domain = domain.split(".")[-2:]
    root_domain = ".".join(root_domain)

    try:
        root_domain_uid = getRootdomain(conn, root_domain)[0]
        print(root_domain_uid)
    except:
        addRootdomain(conn, domain, pe_org_uid, source_uid, org_name)
        root_domain_uid = getRootdomain(conn, root_domain)[0]
    sql = f"""insert into sub_domains(sub_domain, root_domain_uid, root_domain, data_source_uid)
            values ('{domain}', '{root_domain_uid}', '{root_domain}', '{source_uid}');"""
    print(sql)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    print(f"Success adding domain, {domain}, to subdomains table.")


def getDataSource(conn, source):
    cur = conn.cursor()
    sql = f"""SELECT * FROM data_source WHERE name='{source}'"""
    cur.execute(sql)
    source = cur.fetchone()
    cur.close()
    return source

def main():
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
        sql = f"""SELECT organizations_uid FROM organizations WHERE name='{org_name}'"""
        cur.execute(sql)
        pe_org_uid = cur.fetchone()[0]
        cur.close()
        print(f"PE_org_uid: {pe_org_uid}")
    except:
        print("Failed with Select Statement")
        print(traceback.format_exc())

    """Fetch DNSTwist data from Crossfeed"""
    try:
        with open(data_path, "r") as f:
            dnstwist_resp = json.load(f)
        print(dnstwist_resp)

        # Get data source
        source_uid = getDataSource(PE_conn, "DNSTwist")[0]

        domain_list = []
        perm_list = []
        for row in dnstwist_resp:
            # Get subdomain uid
            sub_domain = row["name"]
            print(sub_domain)
            row = row["structuredData"]["domains"]
            try:
                sub_domain_uid = getSubdomain(PE_conn, sub_domain)[0]
            except:
                # Add and then get it
                addSubdomain(PE_conn, sub_domain, pe_org_uid, org_name)
                sub_domain_uid = getSubdomain(PE_conn, sub_domain)[0]

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

                # Ignore duplicates
                permutation = dom["domain-name"]
                if permutation in perm_list:
                    continue
                else:
                    perm_list.append(permutation)

                domain_dict = {
                    "organizations_uid": pe_org_uid,
                    "data_source_uid": source_uid,
                    "sub_domain_uid": sub_domain_uid,
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
            print(perm_list)

    except:
        print("Failed selecting DNSTwist data.")
        print(traceback.format_exc())

    """Insert cleaned data into PE database."""
    try:
        cursor = PE_conn.cursor()
        columns = domain_list[0].keys()
        table = "domain_permutations"
        sql = """INSERT INTO %s(%s) VALUES %%s 
        ON CONFLICT (domain_permutation,organizations_uid) 
        DO UPDATE SET malicious = EXCLUDED.malicious,
            blocklist_attack_count = EXCLUDED.blocklist_attack_count,
            blocklist_report_count = EXCLUDED.blocklist_report_count,
            data_source_uid = EXCLUDED.data_source_uid;""" % (
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


if __name__ == "__main__":
    main()
