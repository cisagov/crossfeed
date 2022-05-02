from config import token

# from pprint import pprint
import requests
import pandas as pd


"""
Multi-Tenancy API:
The Multi-Tenancy API provides endpoints for use with the multi-tenant (MSSP) 
platform.
"""


def get_organization():
    """Get list of organizations."""
    url = "https://api.cybersixgill.com/multi-tenant/organization"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    resp = requests.get(url, headers=headers).json()
    return resp


def post_organization(
    name="name",
    org_com_category="category",
    countries="list_countries",
    industries="list_industries",
):
    """Adds a new organization to SixGill."""
    url = "https://api.cybersixgill.com/multi-tenant/organization"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "name": name,
        "organization_commercial_category": org_com_category,
        "countries": [countries],
        "industries": [industries],
    }
    resp = requests.post(url, headers=headers, json=payload).json()
    print(resp)
    return resp


def delete(org_id):
    """Get list of organizations."""
    url = "https://api.cybersixgill.com/multi-tenant/organization/" + org_id
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"organization_id": org_id}
    resp = requests.delete(url, headers=headers, params=payload).json()
    return resp


def org_assets(org_id):
    """Get list of organizations."""
    url = "https://api.cybersixgill.com/multi-tenant/organization/" + org_id + "/assets"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"organization_id": org_id}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def org_put_assets(org_id, data):
    """Get list of organizations assets."""
    url = "https://api.cybersixgill.com/multi-tenant/organization/" + org_id + "/assets"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    resp = requests.put(url, headers=headers, data=data).json()
    return resp


def org_post_assets(org_id, data):
    """Get list of organizations posts."""
    url = "https://api.cybersixgill.com/multi-tenant/organization/" + org_id + "/assets"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    resp = requests.post(url, headers=headers, json=data).json()
    return resp


"""
Intel Items API
The Intel Items API provides endpoints for obtaining detailed information on 
intel items, aggregations of intel items, and histograms based on a date range 
from the CyberSixGill system.
"""


def intel_agg(
    query,
    date_range="YYYY-MM-DD TO YYYY-MM-DD",
    filters="{'site': ['sixgill','twitter'],'actor': ['John Doe']}",
    field="tags",
    size="10",
    recent="False",
):
    """Get aggregation of intel items via simple query."""
    url = "https://api.cybersixgill.com/intel/aggs"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "query": query,
        "date_range": date_range,
        "filters": filters,
        "field": field,
        "results_size": size,
        "recent_items": recent,
    }
    resp = requests.post(url, headers=headers, data=payload).json()
    return resp


def intel_get(
    query,
    results_size=50,
    highlight=False,
    recent_items=False,
):
    """Get a list of intel items based on a search query."""
    url = "https://api.cybersixgill.com/intel/intel_items"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "query": query,
        "results_size": results_size,
        "highlight": highlight,
        "recent_items": recent_items,
    }
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def intel_post(query, frm, scroll, result_size):
    """Get intel items - advanced variation."""
    url = "https://api.cybersixgill.com/intel/intel_items"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "query": query,
        "partial_content": False,
        "results_size": result_size,
        "scroll": scroll,
        "from": frm,
        "sort": "date",
        "sort_type": "desc",
        "highlight": False,
        "recent_items": False,
        "safe_content_size": True,
    }
    resp = requests.post(url, headers=headers, json=payload).json()
    return resp


def intel_next(scroll_id, recent_items=False):
    """Get the next batch of intel items."""
    url = "https://api.cybersixgill.com/intel/intel_items/next"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "scroll_id": scroll_id,
        "recent_items": recent_items,
    }
    resp = requests.post(url, headers=headers, data=payload).json()
    return resp


def items_thread(
    id,
    thread_site,
    results_size=300,
    skip=0,
    highlight_query="term",
    custom_highlight_start_tag="@sixgill-start-highlight@",
    custom_highlight_end_tag="@sixgill-end-highlight@",
    scroll=False,
    split_to_parts=False,
    recent_items=False,
):
    """Get a thread page content."""
    url = "https://api.cybersixgill.com/intel/intel_items/" + id + "/thread"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "thread_site": thread_site,
        "results_size": results_size,
        "skip": skip,
        "highlight_query": highlight_query,
        "custom_highlight_start_tag": custom_highlight_start_tag,
        "custom_highlight_end_tag": custom_highlight_end_tag,
        "scroll": scroll,
        "split_to_parts": split_to_parts,
        "recent_items": recent_items,
    }
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def intel_thread_next(
    scroll_id,
    split_to_parts=False,
    custom_highlight_start_tag="@sixgill-start-highlight@",
    custom_highlight_end_tag="@sixgill-end-highlight@",
    recent_items=False,
):
    """Get a thread page content."""
    url = "https://api.cybersixgill.com/intel/intel_items/thread/next"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload_data = {"scroll_id": scroll_id}
    payload_params = {
        "split_to_parts": split_to_parts,
        "custom_highlight_start_tag": custom_highlight_start_tag,
        "custom_highlight_end_tag": custom_highlight_end_tag,
        "recent_items": recent_items,
    }
    resp = requests.post(
        url, headers=headers, data=payload_data, params=payload_params
    ).json()
    return resp


def intel_get_item(id):
    """Get an intel item."""
    url = "https://api.cybersixgill.com/intel/intel_items/" + id
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"id": id}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def intel_histogram(
    query,
    date_range="YYYY-MM-DD TO YYYY-MM-DD",
    filters="{'site': ['sixgill','twitter'],'actor': ['John Doe']}",
    interval="month",
    recent_items=False,
):
    """Get date histogram of intel items."""
    url = "https://api.cybersixgill.com/intel/histogram"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "query": query,
        "date_range": date_range,
        "filters": filters,
        "interval": interval,
        "recent_items": recent_items,
    }
    resp = requests.post(url, headers=headers, json=payload).json()
    return resp


"""
Alerts API
The Alerts API provides endpoints for obtaining detailed information on 
actionable alerts. To inject Multi-Tenant usage to retrieve a specific 
organization, 'organization_id' is then required. 
"""


def alerts_list(organization_id, fetch_size, offset):
    """Get actionable alerts by ID using organization_id with optional filters."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {
        "organization_id": organization_id,
        "fetch_size": fetch_size,
        "offset": offset,
    }

    resp = requests.get(url, headers=headers, params=payload)
    return resp


def alerts_delete(
    organization_id="organization_id",
    is_read="unread",
    threat_level="imminent",
    threat_type="type",
):
    """Deletes a list of actionable alerts by ID with optional filters."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert"
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "organization_id": organization_id,
        "is_read": is_read,
        "threat_level": threat_level,
        "threat_type": threat_type,
    }
    resp = requests.delete(url, headers=headers, params=payload).json()
    return resp


def alerts_patch(
    organization_id="organization_id",
    is_read="unread",
    threat_level="imminent",
    threat_type="type",
):
    """Updates a list of actionable alerts by ID with optional filters."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert"
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "organization_id": organization_id,
        "is_read": is_read,
        "threat_level": threat_level,
        "threat_type": threat_type,
    }
    resp = requests.patch(url, headers=headers, params=payload).json()
    return resp


def alert_id(actionable_alert_id, organization_id="organization_id"):
    """Gets an actionable alert by ID."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert/" + actionable_alert_id
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "actionable_alert_id": actionable_alert_id,
        "organization_id": organization_id,
    }
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def alert_delete_id(actionable_alert_id, organization_id="organization_id"):
    """Deletes an actionable alert by ID."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert/" + actionable_alert_id
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "actionable_alert_id": actionable_alert_id,
        "organization_id": organization_id,
    }
    resp = requests.delete(url, headers=headers, params=payload).json()
    return resp


def alert_patch_id(actionable_alert_id, organization_id="organization_id"):
    """Updates an actionable alert by ID."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert/" + actionable_alert_id
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "actionable_alert_id": actionable_alert_id,
        "organization_id": organization_id,
    }
    resp = requests.patch(url, headers=headers, params=payload).json()
    return resp


def alert_stats(organization_id="organization_id", threat_level="imminent"):
    """Gets actionable alerts statistics per user."""
    url = "https://api.cybersixgill.com/alerts/actionable-alert/stats"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"organization_id": organization_id, "threat_level": threat_level}
    resp = requests.patch(url, headers=headers, params=payload).json()
    return resp


def alerts_count(organization_id):
    """Gets the total read and unread actionable alerts by organization."""
    url = "https://api.cybersixgill.com/alerts/actionable_alert/count"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"organization_id": organization_id}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def get_content_id(
    actionable_alert_id,
    organization_id="organization_id",
    limit=100,
    highlight=False,
):
    """Gets actionable alert content by alert ID."""
    url = (
        "https://api.cybersixgill.com/alerts/actionable-alert/actionable_alert_content/"
        + actionable_alert_id
    )
    auth = token()
    headers = (
        {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + auth,
        },
    )
    payload = {
        "actionable_alert_id": actionable_alert_id,
        "organization_id": organization_id,
        "limit": limit,
        "highlight": highlight,
    }
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


"""
DVE Feed
The Alerts API provides endpoints for obtaining detailed information on 
actionable alerts. To inject Multi-Tenant usage to retrieve a specific 
organization, 'organization_id' is then required. 
"""


def dve_consume(integer=100):
    """Get an intel item."""
    url = "https://api.cybersixgill.com/dvefeed/ioc"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"integer": integer, "X-Channel-Id": "d5cd46c205c20c87006b55a18b106428"}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def dve_acknowledge(token):
    """Get an intel item."""
    url = "https://api.cybersixgill.com/dvefeed/ioc/ack"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"X-Channel-Id": "d5cd46c205c20c87006b55a18b106428"}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


"""
DVE Enrichment
The Alerts API provides endpoints for obtaining detailed information on 
actionable alerts. To inject Multi-Tenant usage to retrieve a specific 
organization, 'organization_id' is then required. 

Sample filter for /dve_enrich/enrich:
filters = {
    "query": "2020-0",
    "ids": ["CVE-2020-0674"],"attributes": ["Has_POC_exploit_attribute"],"sixgill_rating_range": {"from": 1,"to": 8},
    "nvd_rating_range": {"from": 1,"to": 8},
    "nvd_3_rating_range": {"from": 1,"to": 8},
    "nvd_modified_dates_range": {"from": {},"to": {}},
    "nvd_published_dates_range": {"from": {},"to": {}},
    "total_mention_counts_range": {"from": 1,"to": 8},
    "last_month_mention_counts_range": {"from": 1,"to": 8},
    "first_mention_dates_range": {"from": {},"to": {}},
    "last_mention_dates_range": {"from": {},"to": {}}},
    "results_size": 10,"from_index": 0}',

"""


def dve_enrich(filters):
    """Enrich CVEs with Sixgill intelligence."""
    url = "https://api.cybersixgill.com/dve_enrich/enrich"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"filters": filters}
    resp = requests.post(url, headers=headers, params=payload).json()
    return resp


def dve_get_id(id):
    """Get data about a specific CVE"""
    url = "https://api.cybersixgill.com/dve_enrich/" + id
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"id": id}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def dve_summary(startDate, endDate):
    """Get basic Sixgill Dynamic Rating data about a specific CVE."""
    url = "https://api.cybersixgill.com/dve_enrich/summary"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"startDate": startDate, "endDate": endDate}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def dve_changes(startDate, endDate):
    """Get data about a specific CVE"""
    url = "https://api.cybersixgill.com/dve_enrich/changes"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"startDate": startDate, "endDate": endDate}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def dve_keyword_search(keyword, startDate, endDate):
    """Get data about a specific CVE"""
    url = "https://api.cybersixgill.com/dve_enrich/keyword_search"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"keyword": keyword, "startDate": startDate, "endDate": endDate}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


def dve_top_cves(size):
    """Get data about a specific CVE"""
    url = "https://api.cybersixgill.com/dve_enrich/top_cves"
    auth = token()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }
    payload = {"size": size}
    resp = requests.get(url, headers=headers, params=payload).json()
    return resp


"""
Credentials API
Get leaked credentials based on a date range from the Sixgill system.
"""


def credential_auth(params):
    """Get data about a specific CVE"""
    url = "https://api.cybersixgill.com/credentials/leaks"
    auth = token()
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Authorization": "Bearer " + auth,
    }

    resp = requests.get(url, headers=headers, params=params)
    resp = resp.json()
    return resp


"""Use for testing purposes only. """
# pprint(get_organization())
# pprint(org_assets("611544c7bd7c8ce0b667726c"))
