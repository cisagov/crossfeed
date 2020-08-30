"""
mitmproxy addon that signs requests and adds a Crossfeed-specific user agent.
"""
from mitmproxy import http, ctx
import os
import requests
import json
import traceback
from requests_http_signature import HTTPSignatureHeaderAuth

class SignRequests:
    def __init__(self, key_id="", key_secret="", user_agent=""):
        self.key_id = key_id
        self.key_secret = key_secret
        self.user_agent = user_agent
        self.signature_auth = HTTPSignatureHeaderAuth(key=key_secret.encode(), key_id=key_id, algorithm="hmac-sha256")

    def key_resolver(self, key_id, algorithm):
        return self.key_secret.encode()

    def verify_signature(self, method, url, date, signature):
        HTTPSignatureHeaderAuth.verify(requests.Request(method=url, url=url, headers={"date": date, "Signature": signature}), self.key_resolver, "Signature")

    def request(self, flow):
        try:
            if self.user_agent:
                flow.request.headers["User-Agent"] = self.user_agent
            
            if self.key_secret:            
                # For ease of verification, only sign the minimum attributes required: URL, date, and method.
                signed_request = requests.Request(method=flow.request.method, url=flow.request.url, headers={}, data=None).prepare()
                self.signature_auth.__call__(signed_request)
                flow.request.headers["Signature"] = signed_request.headers["Signature"]
                flow.request.headers["Date"] = signed_request.headers["Date"]

                # ctx.log.info("Sent HTTP request with signature " + signed_request.headers["Signature"])
        except Exception as e:
            flow.response = http.HTTPResponse.make(
                500,
                f"mitmproxy failed:<br> {e}<br><br>{traceback.format_exc()}",
                {"Content-Type": "text/html"}
            )
        # ctx.log.info("We've seen %d flows" % self.num)


addons = [
    SignRequests(key_id='crossfeed', key_secret = os.getenv("WORKER_SIGNATURE_SECRET", ""), user_agent = os.getenv("WORKER_USER_AGENT", ""))
]