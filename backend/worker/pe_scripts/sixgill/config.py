#!/usr/bin/python
""" 
Authenticating Requests:
API authentication is performed via HTTP Basic Auth using the API Client 
and Secret you generated (see Generating API Credentials). The authentication 
method uses scheme and returns a token that you must use in your request 
headers.
"""

import requests
import os

SIXGILL_CLIENT_ID = os.environ.get("SIXGILL_CLIENT_ID")
SIXGILL_CLIENT_SECRET = os.environ.get("SIXGILL_CLIENT_SECRET")


def token():
    """Retrieves bearer token from sixgill client."""
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
