"""
mitmproxy addon that signs requests and adds a Crossfeed-specific user agent.
"""
from mitmproxy import http, ctx
import os
import requests
import json
import traceback
from requests_http_signature import HTTPSignatureHeaderAuth

preshared_key_id = 'cisa'
preshared_secret = b'monorail_cat'
url = 'http://example.com/path'

signature_auth = HTTPSignatureHeaderAuth(key=preshared_secret, key_id=preshared_key_id, algorithm="hmac-sha256")

def key_resolver(key_id, algorithm):
    return b'monorail_cat'

def verify_signature(method, url, date, signature):
    HTTPSignatureHeaderAuth.verify(requests.Request(method=url, url=url, headers={"date": date, "Signature": signature}), key_resolver, "Signature")

class SignRequests:
    def request(self, flow):
        try:
            flow.request.headers["User-Agent"] = os.getenv("WORKER_USER_AGENT", "CISA Crossfeed: Crossfeed is a tool that continuously enumerates and monitors an organization's public-facing attack surface in order to discover assets and flag potential security flaws. For more information, see https://github.com/cisagov/crossfeed.")
            print(dict(method = flow.request.method, url=flow.request.url, headers={}, data=flow.request.content))
            
            # For ease of verification, only sign the minimum required: URL, date, and method.
            signed_request = requests.Request(method=flow.request.method, url=flow.request.url, headers={}, data=None).prepare()
            signature_auth.__call__(signed_request)
            flow.request.headers["Signature"] = signed_request.headers["Signature"]
            flow.request.headers["Date"] = signed_request.headers["Date"]
            if "Digest" in signed_request.headers:
                flow.request.headers["Digest"] = signed_request.headers["Digest"]
            
            verify_signature(method=flow.request.method, url=flow.request.url, date=flow.request.headers["Date"], signature=flow.request.headers["Signature"])
        except Exception as e:
            flow.response = http.HTTPResponse.make(
                500,  # (optional) status code
                f"mitmproxy failed:<br> {e}<br><br>{traceback.format_exc()}",
                {"Content-Type": "text/html"}
            )
        # ctx.log.info("We've seen %d flows" % self.num)


addons = [
    SignRequests()
]