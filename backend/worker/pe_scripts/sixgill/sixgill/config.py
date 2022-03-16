#!/usr/bin/python
""" 
Authenticating Requests:
API authentication is performed via HTTP Basic Auth using the API Client 
and Secret you generated (see Generating API Credentials). The authentication 
method uses scheme and returns a token that you must use in your request 
headers.
"""

from configparser import ConfigParser
import requests
import os


SECRETS = "/app/worker/pe_scripts/sixgill/config/config.ini"
SECTION = "sixgill"
SIXGILL_CLIENT_ID = os.environ.get("SIXGILL_CLIENT_ID")
SIXGILL_CLIENT_SECRET = os.environ.get("SIXGILL_CLIENT_SECRET")


def token():
    """Retrieves bearer token from sixgill client."""
    parser = ConfigParser()
    parser.read(SECRETS)
    if parser.has_section(SECTION):
        params = parser.items(SECTION)
        _id, _secret = params[0], params[1]
        client_id = _id[1]
        client_secret = _secret[1]
    else:
        raise Exception(
            "Section {0} not found in the {1} file".format(SECTION, SECRETS)
        )
    url = "https://api.cybersixgill.com/auth/token/"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
    }
    payload = {
        "grant_type": "client_credentials",
        "client_id": SIXGILL_CLIENT_ID,
        "client_secret": SIXGILL_CLIENT_SECRET,
    }
    resp = requests.post(url, headers=headers, data=payload).json()
    token = resp["access_token"]
    return token
