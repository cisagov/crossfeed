try:
    import traceback
    import shodan
    import pandas as pd
    import requests
    from dateutil import parser, tz
    import time
    import os
    import datetime
    import json
    from pe_db_functions import connect, close, execute_shodan_data, get_org_id, query_ips
except:
    print(traceback.format_exc())

DB_HOST = os.environ.get("DB_HOST")
PE_DB_USERNAME =os.environ.get("PE_DB_USERNAME")
PE_DB_NAME = os.environ.get("PE_DB_NAME")
PE_DB_PASSWORD = os.environ.get("PE_DB_PASSWORD")
API_KEY = os.environ.get("key")
org_list = os.environ.get("org_list")


def get_dates():
    end = datetime.datetime.now()
    d = datetime.timedelta(days = 21)
    d2 = datetime.timedelta(days=1)
    start = end - d
    end = end + d2
    return start, end

def time_to_utc(in_time):
    """converts time to UTC.  if the time passed in does not have
    zone information, it is assumed to be the local timezone"""
    if in_time.tzinfo == None:
        in_time = in_time.replace(tzinfo=tz.tzlocal())
    utc_time = in_time.astimezone(tz.tzutc())
    return utc_time

def search(
    org_uid,
    api,
    ips,
    start,
    end,
    risky_ports,
    name_dict,
    risk_dict
):
    """searches Shodan API, splits data, and adds in additional information"""
    data = []
    risk_data = []
    vuln_data = []

    # create dictionaries for CVSSv2 vector definitions using https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator
    auth_dict = {
        "NONE": "Authentication is not required to access and exploit the vulnerability.",
        "SINGLE": "One instance of authentication is required to access and exploit the vulnerability.",
        "MULTIPLE": "Exploiting the vulnerability requires that the attacker authenticate two or more times, even if the same credentials are used each time. An example is an attacker authenticating to an operating system in addition to providing credentials to access an application hosted on that system.",
    }
    av_dict = {
        "NETWORK": "A vulnerability exploitable with network access means the vulnerable software is bound to the network stack and the attacker does not require local network access or local access. Such a vulnerability is often termed “remotely exploitable”. An example of a network attack is an RPC buffer overflow.",
        "ADJACENT_NETWORK": "A vulnerability exploitable with adjacent network access requires the attacker to have access to either the broadcast or collision domain of the vulnerable software. Examples of local networks include local IP subnet, Bluetooth, IEEE 802.11, and local Ethernet segment.",
        "LOCAL": "A vulnerability exploitable with only local access requires the attacker to have either physical access to the vulnerable system or a local (shell) account. Examples of locally exploitable vulnerabilities are peripheral attacks such as Firewire/USB DMA attacks, and local privilege escalations (e.g., sudo).",
    }
    ac_dict = {
        "LOW": "Specialized access conditions or extenuating circumstances do not exist. The following are examples: The affected product typically requires access to a wide range of systems and users, possibly anonymous and untrusted (e.g., Internet-facing web or mail server). The affected configuration is default or ubiquitous. The attack can be performed manually and requires little skill or additional information gathering. The 'race condition' is a lazy one (i.e., it is technically a race but easily winnable).",
        "MEDIUM": "The access conditions are somewhat specialized; the following are examples: The attacking party is limited to a group of systems or users at some level of authorization, possibly untrusted. Some information must be gathered before a successful attack can be launched. The affected configuration is non-default, and is not commonly configured (e.g., a vulnerability present when a server performs user account authentication via a specific scheme, but not present for another authentication scheme). The attack requires a small amount of social engineering that might occasionally fool cautious users (e.g., phishing attacks that modify a web browser’s status bar to show a false link, having to be on someone’s “buddy” list before sending an IM exploit).",
        "HIGH": "Specialized access conditions exist. For example, in most configurations, the attacking party must already have elevated privileges or spoof additional systems in addition to the attacking system (e.g., DNS hijacking). The attack depends on social engineering methods that would be easily detected by knowledgeable people. For example, the victim must perform several suspicious or atypical actions. The vulnerable configuration is seen very rarely in practice. If a race condition exists, the window is very narrow.",
    }
    ci_dict = {
        "NONE": "There is no impact to the confidentiality of the system",
        "PARTIAL": "There is considerable informational disclosure. Access to some system files is possible, but the attacker does not have control over what is obtained, or the scope of the loss is constrained. An example is a vulnerability that divulges only certain tables in a database.",
        "COMPLETE": "There is total information disclosure, resulting in all system files being revealed. The attacker is able to read all of the system's data (memory, files, etc.).",
    }
    ii_dict = {
        "NONE": "There is no impact to the integrity of the system",
        "PARTIAL": "Modification of some system files or information is possible, but the attacker does not have control over what can be modified, or the scope of what the attacker can affect is limited. For example, system or application files may be overwritten or modified, but either the attacker has no control over which files are affected or the attacker can modify files within only a limited context or scope.",
        "COMPLETE": "There is a total compromise of system integrity. There is a complete loss of system protection, resulting in the entire system being compromised. The attacker is able to modify any files on the target system.",
    }
    ai_dict = {
        "NONE": "There is no impact to the availability of the system",
        "PARTIAL": "There is reduced performance or interruptions in resource availability. An example is a network-based flood attack that permits a limited number of successful connections to an Internet service.",
        "COMPLETE": "There is reduced performance or interruptions in resource availability. An example is a network-based flood attack that permits a limited number of successful connections to an Internet service.",
    }
    # Wrap the request in a try/ except block to catch errors
    ip_chunks = [ips[i : i + 100] for i in range(0, len(ips), 100)]
    tot_ips = len(ips)
    tot = len(ip_chunks)
    print(f"Split {tot_ips} into {tot} chunks",flush=True)
    for i, ips in enumerate(ip_chunks):
        try:
            # Search Shodan

            results = api.host(ips, history=True)
            for r in results:
                for d in r["data"]:
                    if (
                        time_to_utc(parser.parse(d["timestamp"])) > start
                        and time_to_utc(parser.parse(d["timestamp"])) < end
                    ):
                        prod = d.get("product", None)
                        serv = d.get("http", {}).get("server")
                        asn = d.get("ASN", None)
                        vulns = d.get("vulns", None)
                        if vulns != None:
                            cves = list(vulns.keys())
                            unverified = []
                            for cve in cves:
                                v = vulns[cve]
                                if v["verified"] == True:
                                    re = requests.get(
                                        f"https://cve.circl.lu/api/cve/{cve}"
                                    )
                                    r_json = re.json()
                                    if r_json != None:
                                        summary = r_json.get("summary", None)
                                        product = r_json.get("vulnerable_product", None)
                                        attack_vector = r_json.get("access", {}).get(
                                            "vector"
                                        )
                                        av = av_dict.get(attack_vector, None)
                                        attack_complexity = r_json.get(
                                            "access", {}
                                            ).get("complexity")
                                        ac = ac_dict.get(attack_complexity, None)
                                        conf_imp = r_json.get("impact", {}).get(
                                            "confidentiality"
                                        )
                                        ci = ci_dict.get(conf_imp, None)
                                        int_imp = r_json.get("impact", {}).get(
                                            "integrity"
                                        )
                                        ii = ci_dict.get(int_imp, None)
                                        avail_imp = r_json.get("impact", {}).get(
                                            "availability"
                                        )
                                        ai = ci_dict.get(avail_imp, None)
                                        cvss = r_json.get("cvss", None)
                                        if cvss == 10:
                                            severity = "Critical"
                                        elif cvss >= 7:
                                            severity = "High"
                                        elif cvss >= 4:
                                            severity = "Medium"
                                        elif cvss > 0:
                                            severity = "Low"
                                        else:
                                            severity = None
                                    else:
                                        # if circl doesn't have the verified vulnerability, set circl information to null
                                        summary = ""
                                        product = ""
                                        attack_vector = ""
                                        av = ""
                                        attack_complexity = ""
                                        ac = ""
                                        conf_imp = ""
                                        ci = ""
                                        int_imp = ""
                                        ii = ""
                                        avail_imp = ""
                                        ai = ""
                                    vuln_data.append(
                                        [
                                            org_uid,
                                            r["org"],
                                            r["ip_str"],
                                            d["port"],
                                            d["_shodan"]["module"],
                                            d["timestamp"],
                                            cve,
                                            severity,
                                            cvss,
                                            summary,
                                            product,
                                            attack_vector,
                                            av,
                                            attack_complexity,
                                            ac,
                                            conf_imp,
                                            ci,
                                            int_imp,
                                            ii,
                                            avail_imp,
                                            ai,
                                            r["tags"],
                                            r["domains"],
                                            r["hostnames"],
                                            r["isp"],
                                            asn,
                                        ]
                                    )
                                else:
                                    unverified.append(cve)
                            if len(unverified) > 0:
                                #
                                ftype = "Pontentially Vulnerable Product"
                                name = prod
                                risk = unverified
                                # TODO build out mitigation recommendation for potentially vulnerable products
                                mitigation = "Verify asset is up to date, supported by the vendor, and configured securely"
                                risk_data.append(
                                    [
                                        org_uid,
                                        r["org"],
                                        r["ip_str"],
                                        d["port"],
                                        d["_shodan"]["module"],
                                        ftype,
                                        name,
                                        risk,
                                        mitigation,
                                        d["timestamp"],
                                        prod,
                                        serv,
                                        r["tags"],
                                        r["domains"],
                                        r["hostnames"],
                                        r["isp"],
                                        asn,
                                    ]
                                )

                        elif d["_shodan"]["module"] in risky_ports:
                            ftype = "Insecure Protocol"
                            name = name_dict[d["_shodan"]["module"]]
                            risk = [risk_dict[d["_shodan"]["module"]]]
                            # TODO build out mitigation recommendation for insecure protocols
                            mitigation = "Confirm open port has a required business use for internet exposure and ensure necessary safeguards are in place through TCP wrapping, TLS encryption, or authentication requirements"
                            risk_data.append(
                                [   
                                    org_uid,
                                    r["org"],
                                    r["ip_str"],
                                    d["port"],
                                    d["_shodan"]["module"],
                                    ftype,
                                    name,
                                    risk,
                                    mitigation,
                                    d["timestamp"],
                                    prod,
                                    serv,
                                    r["tags"],
                                    r["domains"],
                                    r["hostnames"],
                                    r["isp"],
                                    asn,
                                ]
                            )
                        data.append(
                            [
                                org_uid,
                                r["org"],
                                r["ip_str"],
                                d["port"],
                                d["_shodan"]["module"],
                                d["timestamp"],
                                prod,
                                serv,
                                r["tags"],
                                r["domains"],
                                r["hostnames"],
                                r["isp"],
                                asn,
                            ]
                        )
            time.sleep(1)

        # TODO: Put in a while loop instead of single try and except
        except shodan.APIError as e: 
            passed = False
            count = 2
            while passed == False:
                print(f"Calling the API again. Try #{count}")
                try:
                    print("Error: {}".format(e))

                    # print error traceback
                    print(traceback.format_exc())

                    # sleep for 5 seconds
                    time.sleep(5)
                    # Search Shodan
                    results = api.host(ips, history=True)
                    for r in results:
                        for d in r["data"]:
                            if (
                                time_to_utc(parser.parse(d["timestamp"])) > start
                                and time_to_utc(parser.parse(d["timestamp"])) < end
                            ):
                                prod = d.get("product", None)
                                serv = d.get("http", {}).get("server")
                                asn = d.get("ASN", None)
                                vulns = d.get("vulns", None)
                                if vulns != None:
                                    cves = list(vulns.keys())
                                    unverified = []
                                    for cve in cves:
                                        v = vulns[cve]
                                        if v["verified"] == True:
                                            re = requests.get(
                                                f"https://cve.circl.lu/api/cve/{cve}"
                                            )
                                            r_json = re.json()
                                            if r_json != None:
                                                summary = r_json.get("summary", None)
                                                product = r_json.get(
                                                    "vulnerable_product", None
                                                )
                                                attack_vector = r_json.get(
                                                    "access", {}
                                                    ).get("vector")
                                                av = av_dict.get(attack_vector, None)
                                                attack_complexity = r_json.get(
                                                    "access", {}
                                                ).get("complexity")
                                                ac = ac_dict.get(
                                                    attack_complexity, None
                                                )
                                                conf_imp = r_json.get("impact", {}).get(
                                                    "confidentiality"
                                                )
                                                ci = ci_dict.get(conf_imp, None)
                                                int_imp = r_json.get("impact", {}).get(
                                                    "integrity"
                                                )
                                                ii = ci_dict.get(int_imp, None)
                                                avail_imp = r_json.get(
                                                    "impact", {}
                                                    ).get("availability")
                                                ai = ci_dict.get(avail_imp, None)
                                                cvss = r_json.get("cvss", None)
                                                if cvss == 10:
                                                    severity = "Critical"
                                                elif cvss >= 7:
                                                    severity = "High"
                                                elif cvss >= 4:
                                                    severity = "Medium"
                                                elif cvss > 0:
                                                    severity = "Low"
                                                else:
                                                    severity = None
                                            else:
                                                # if circl doesn't have the verified vulnerability, set circl information to null
                                                summary = ""
                                                product = ""
                                                attack_vector = ""
                                                av = ""
                                                attack_complexity = ""
                                                ac = ""
                                                conf_imp = ""
                                                ci = ""
                                                int_imp = ""
                                                ii = ""
                                                avail_imp = ""
                                                ai = ""
                                            vuln_data.append(
                                                [
                                                    org_uid,
                                                    r["org"],
                                                    r["ip_str"],
                                                    d["port"],
                                                    d["_shodan"]["module"],
                                                    d["timestamp"],
                                                    cve,
                                                    severity,
                                                    cvss,
                                                    summary,
                                                    product,
                                                    attack_vector,
                                                    av,
                                                    attack_complexity,
                                                    ac,
                                                    conf_imp,
                                                    ci,
                                                    int_imp,
                                                    ii,
                                                    avail_imp,
                                                    ai,
                                                    r["tags"],
                                                    r["domains"],
                                                    r["hostnames"],
                                                    r["isp"],
                                                    asn,
                                                ]
                                            )
                                        else:
                                            unverified.append(cve)
                                    if len(unverified) > 0:
                                        #
                                        ftype = "Pontentially Vulnerable Product"
                                        name = prod
                                        risk = unverified
                                        # TODO build out mitigation recommendation for potentially vulnerable products
                                        mitigation = "Verify asset is up to date, supported by the vendor, and configured securely"
                                        risk_data.append(
                                            [   
                                                org_uid,
                                                r["org"],
                                                r["ip_str"],
                                                d["port"],
                                                d["_shodan"]["module"],
                                                ftype,
                                                name,
                                                risk,
                                                mitigation,
                                                d["timestamp"],
                                                prod,
                                                serv,
                                                r["tags"],
                                                r["domains"],
                                                r["hostnames"],
                                                r["isp"],
                                                asn,
                                            ]
                                        )

                                elif d["_shodan"]["module"] in risky_ports:
                                    ftype = "Insecure Protocol"
                                    name = name_dict[d["_shodan"]["module"]]
                                    risk = [risk_dict[d["_shodan"]["module"]]]
                                    # TODO build out mitigation recommendation for insecure protocols
                                    mitigation = "Confirm open port has a required business use for internet exposure and ensure necessary safeguards are in place through TCP wrapping, TLS encryption, or authentication requirements"
                                    risk_data.append(
                                        [   
                                            org_uid,
                                            r["org"],
                                            r["ip_str"],
                                            d["port"],
                                            d["_shodan"]["module"],
                                            ftype,
                                            name,
                                            risk,
                                            mitigation,
                                            d["timestamp"],
                                            prod,
                                            serv,
                                            r["tags"],
                                            r["domains"],
                                            r["hostnames"],
                                            r["isp"],
                                            asn,
                                        ]
                                    )
                                data.append(
                                    [   
                                        org_uid,
                                        r["org"],
                                        r["ip_str"],
                                        d["port"],
                                        d["_shodan"]["module"],
                                        d["timestamp"],
                                        prod,
                                        serv,
                                        r["tags"],
                                        r["domains"],
                                        r["hostnames"],
                                        r["isp"],
                                        asn,
                                    ]
                                )
                    passed = True
                except:
                    print(traceback.format_exc())
                    count += 1
                    if count == 7:
                        break
                    continue
        except:
            print("Error on first try, not caught by Shodan API Exception")
            print("Will continue to next chunk.")
            print(traceback.format_exc())
            continue

        count = i + 1
        print(f"{count}/{tot} complete")

    df = pd.DataFrame(
        data,
        columns=[
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
        ],
    )
    risk_df = pd.DataFrame(
        risk_data,
        columns=[
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
        ],
    )
    vuln_df = pd.DataFrame(
        vuln_data,
        columns=[
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
        ],
    )
    conn = connect(DB_HOST,PE_DB_NAME, PE_DB_USERNAME, PE_DB_PASSWORD)
    execute_shodan_data(conn, df, "shodan_assets")
    
    execute_shodan_data(conn, risk_df, "shodan_insecure_protocols_unverified_vulns")
    
    execute_shodan_data(conn, vuln_df, "shodan_verified_vulns")

    close(conn)

    return df, risk_df, vuln_df

def calculate_metrics(
    org_uid, start_time, end_time
):
    """retrieves Shodan data and calculates metrics"""
    api = shodan.Shodan(API_KEY)
    start = time_to_utc(start_time)
    end = time_to_utc(end_time)
    conn = connect()
    ip_df = query_ips(conn, org_uid)
    ips = list(ip_df["ip_addresses"].values)
    # ip_df = pd.read_csv('/app/worker/pe_scripts/ips.csv', encoding="utf-8") #Remove this line and uncomment 3 lines above to go live
    # ips = list(ip_df["IP"].values) #Remove this line and uncomment 3 lines above to go live
    tot_ips = len(ips)
    risky_ports = [
        "ftp",
        "telnet",
        "http",
        "smtp",
        "pop3",
        "imap",
        "netbios",
        "snmp",
        "ldap",
        "smb",
        "sip",
        "rdp",
        "vnc",
        "kerberos",
    ]
    protocol_dict = {
        "ftp": "Clear text protocol, does not encrypt transported data",
        "telnet": "Clear text protocol, does not encrypt transported data",
        "http": "Clear text protocol, does not encrypt transported data",
        "smtp": "Clear text protocol, does not encrypt transported data",
        "pop3": "Clear text protocol, does not encrypt transported data",
        "imap": "Clear text protocol, does not encrypt transported data",
        "netbios": "Clear text protocol, does not encrypt transported data",
        "snmp": "If version 1 or 2, clear text protocol, does not encrypt transported data",
        "ldap": "Clear text protocol, does not encrypt transported data",
        "smb": "Known vulnerabilities",
        "sip": "Known vulnerabilities",
        "rdp": "Known vulnerabilities",
        "vnc": "Known vulnerabilities",
        "kerberos": "Known vulnerabilities",
    }
    name_dict = {
        "ftp": "File Transfer Protocol",
        "telnet": "Telnet",
        "http": "Hypertext Transfer Protocol",
        "smtp": "Simple Mail Transfer Protocol",
        "pop3": "Post Office Protocol 3",
        "imap": "Internet Message Access Protocol",
        "netbios": "Network Basic Input/Output System",
        "snmp": "Simple Network Management Protocol",
        "ldap": "Lightweight Directory Access Protocol",
        "smb": "Server Message Block",
        "sip": "Session Initiation Protocol",
        "rdp": "Remote Desktop Protocol",
        "kerberos": "Kerberos",
    }
    risk_dict = {
        "ftp": "FTP",
        "telnet": "Telnet",
        "http": "HTTP",
        "smtp": "SMTP",
        "pop3": "POP3",
        "imap": "IMAP",
        "netbios": "NetBIOS",
        "snmp": "SNMP",
        "ldap": "LDAP",
        "smb": "SMB",
        "sip": "SIP",
        "rdp": "RDP",
        "vnc": "VNC",
        "kerberos": "Kerberos",
    }

    df, risk_df, vuln_df = search(
        org_uid,
        api,
        ips,
        start,
        end,
        risky_ports,
        name_dict,
        risk_dict,
    )

try:
    print("Starting new thread")
    
    org_list = json.loads(org_list)
    print(org_list, flush=True)
    for org_name in org_list:
        print("Running IPs for ",org_name, flush=True)
        org_name = org_list[1]
        PE_conn = connect(DB_HOST, PE_DB_NAME, PE_DB_USERNAME, PE_DB_PASSWORD)
        org_uid = get_org_id(PE_conn, org_name )
        close(PE_conn)
        start, end = get_dates()
        calculate_metrics( org_uid, start, end )
except:
    print(traceback.format_exc())