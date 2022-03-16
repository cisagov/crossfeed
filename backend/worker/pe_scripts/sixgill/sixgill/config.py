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
from ..run_cybersixgill import getCreds

SIXGILL_CLIENT_ID, SIXGILL_CLIENT_SECRET = getCreds()


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
