"""Scripts for importing Sixgill data into PE Postgres database."""

from api import (
    get_organization,
    org_assets,
    alerts_list,
    org_assets,
    credential_auth,
    dve_top_cves,
    alerts_count,
    intel_post,
)
import pandas as pd


def list_organizations():
    """List Posture & Exposure organizations in SixGill."""
    orgs = get_organization()
    df_orgs = pd.DataFrame(orgs)
    return df_orgs


def alias_organization(org_id):
    """List an organization's aliases."""
    assets = org_assets(org_id)
    df_assets = pd.DataFrame(assets)
    # df_assets.reset_index(level=None, drop=True, inplace=True, col_level=0, col_fill="")
    aliases = df_assets["organization_aliases"].loc["explicit":].tolist()[0]
    # df_explicit = df_assets.iloc[[1]]
    # aliases = str(df_explicit["organization_aliases"].item())
    return aliases


def root_domains(org_id):
    assets = org_assets(org_id)
    print(assets)
    df_assets = pd.DataFrame(assets)
    # df_assets.reset_index(level=None, drop=True, inplace=True, col_level=0, col_fill="")
    root_domains = df_assets["domain_names"].loc["explicit":].tolist()[0]
    print(root_domains)
    # df_explicit = df_assets.iloc[[1]]
    # root_domains = str(df_explicit["domain_names"].item())
    return root_domains


def mentions(date, aliases):
    """Pull dark web mentions data for an organization."""
    # aliases = aliases.replace("'", '"')
    # aliases = str(aliases)[1:-1]
    mentions = ""
    for mention in aliases:
        mentions += '"' + mention + '"' + ","
    mentions = mentions[:-1]
    print(mentions)
    query = "site:forum_* AND date:" + date + " AND " + "(" + str(mentions) + ")"
    print("CyberSixGill Query: ", query)

    count = 0
    while count <= 5:
        try:
            print(f"Intel post try #{count + 1}")
            resp = intel_post(query, frm=0, scroll=False, result_size=1)
            count = 6
        except:
            print("Error. Trying intel_post again...")
            count += 1
            continue
    count_total = resp["total_intel_items"]
    print("Total Mentions: ", count_total)

    i = 0
    all_mentions = []
    if count_total < 10000:
        while i < count_total:
            # Recommended "from" and "result_size" is 50. The maximum is 400.
            resp = intel_post(query, frm=i, scroll=False, result_size=200)
            i = i + 200
            print(f"Getting {i} of {count_total}....")
            intel_items = resp["intel_items"]
            df_mentions = pd.DataFrame.from_dict(intel_items)
            all_mentions.append(df_mentions)
            df_all_mentions = pd.concat(all_mentions).reset_index(drop=True)

    else:
        while i < count_total:
            # Recommended "from" and "result_size" is 50. The maximum is 400.
            resp = intel_post(query, frm=i, scroll=True, result_size=400)
            i = i + 400
            print(f"Getting {i} of {count_total}....")
            intel_items = resp["intel_items"]
            df_mentions = pd.DataFrame.from_dict(intel_items)
            all_mentions.append(df_mentions)
            df_all_mentions = pd.concat(all_mentions).reset_index(drop=True)

    df_all_mentions = pd.concat(all_mentions).reset_index(drop=True)
    return df_all_mentions


def alerts(org_id):
    """Get actionable alerts for an organization."""
    count = alerts_count(org_id)
    count_total = count["total"]
    print("Total Alerts: ", count_total)

    # Recommended "fetch_size" is 50. The maximum is 400.
    fetch_size = 25
    all_alerts = []

    for offset in range(0, count_total, fetch_size):
        resp = alerts_list(org_id, fetch_size, offset).json()
        df_alerts = pd.DataFrame.from_dict(resp)
        all_alerts.append(df_alerts)
        df_all_alerts = pd.concat(all_alerts).reset_index(drop=True)

    return df_all_alerts


def top_cves(size):
    """Top 10 CVEs mention in the dark web."""
    resp = dve_top_cves(size)
    df_top_cves = pd.DataFrame(resp)
    return df_top_cves


def creds(domain, from_date, to_date):
    skip = 0
    params = {
        "domain": domain,
        "from_date": from_date,
        "to_date": to_date,
        "max_results": 100,
        "skip": skip,
    }
    resp = credential_auth(params)
    total_hits = resp["total_results"]
    resp = resp["leaks"]
    while total_hits > len(resp):
        skip += 1
    params["skip"] = skip
    next_resp = credential_auth(params)
    resp = resp + next_resp["leaks"]
    resp = pd.DataFrame(resp)
    df = resp.drop_duplicates(
        subset=["email", "breach_name"], keep="first"
    ).reset_index(drop=True)
    return df


if __name__ == "__main__":
    """Config to pull DHS"""
    list_organizations()
    aliases = alias_organization("611544c7bd7c8ce0b667726c")
    mentions("[2021-09-16 TO 2021-09-30]", aliases)
    alerts("611544c7bd7c8ce0b667726c")

    # top_cves(10)
    # creds("dhs.gov", "demo@dhs.gov", max_results=100, skip=0)
