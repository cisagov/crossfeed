"""Scripts for importing Sixgill data into PE Postgres database."""

from sixgill.api import (
    get_organization,
    org_assets,
    intel_get,
    alerts_list,
    org_assets,
    credential_auth,
    dve_top_cves,
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
    df_assets.reset_index(level=None, drop=True, inplace=True, col_level=0, col_fill="")
    df_explicit = df_assets.iloc[[1]]
    aliases = str(df_explicit["organization_aliases"].item())
    return aliases


def root_domains(org_id):
    assets = org_assets(org_id)
    df_assets = pd.DataFrame(assets)
    df_assets.reset_index(level=None, drop=True, inplace=True, col_level=0, col_fill="")
    df_explicit = df_assets.iloc[[1]]
    root_domains = str(df_explicit["domain_names"].item())
    return root_domains


def mentions(date, aliases):
    """Pull dark web mentions data for an organization."""
    aliases = aliases.replace("'", '"')
    aliases = str(aliases)[1:-1]
    mentions = ""
    for mention in aliases:
        mentions += mention
    query = "site:forum_* AND date:" + date + " AND " + "(" + str(mentions) + ")"
    print("\nCyberSixGill Query:\n ", query)
    resp = intel_get(query)
    print(resp)
    df_mentions = pd.DataFrame.from_dict(resp["intel_items"])
    return df_mentions


def alerts(org_id):
    """Get actionable alerts for an organization."""
    resp = alerts_list(org_id).json()
    df_alerts = pd.DataFrame.from_dict(resp)
    return df_alerts


def top_cves(size):
    """Top 10 CVEs mention in the dark web."""
    resp = dve_top_cves(size)
    print(resp)
    # df_top_cves = pd.DataFrame(resp)
    # print(df_top_cves)
    return  # df_top_cves


def creds(domain):
    skip = 0
    params = {
        "domain": domain,
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
    print(df)
    print(total_hits)
    print(df.columns)
    return df


if __name__ == "__main__":
    """Config to pull DHS"""
    list_organizations()
    aliases = alias_organization("611544c7bd7c8ce0b667726c")
    mentions("[2021-09-16 TO 2021-09-30]", aliases)
    alerts("611544c7bd7c8ce0b667726c")

    # top_cves(10)
    # creds("dhs.gov", "demo@dhs.gov", max_results=100, skip=0)
