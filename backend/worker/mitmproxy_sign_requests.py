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
    def __init__(self, key_id="", public_key="", private_key="", user_agent=""):
        self.key_id = key_id
        self.private_key = private_key
        self.public_key = public_key
        self.user_agent = user_agent
        self.signature_auth = HTTPSignatureHeaderAuth(
            key=self.private_key.encode(), key_id=key_id, algorithm="rsa-sha256"
        )

    def key_resolver(self, key_id, algorithm):
        return self.public_key.encode()

    def verify_signature(self, method, url, date, signature):
        HTTPSignatureHeaderAuth.verify(
            requests.Request(
                method=url, url=url, headers={"date": date, "Signature": signature}
            ),
            self.key_resolver,
            "Signature",
        )

    def request(self, flow):
        try:
            if self.user_agent:
                flow.request.headers["User-Agent"] = self.user_agent

            if self.private_key:
                # For ease of verification, only sign the minimum attributes required: URL, date, and method.
                signed_request = requests.Request(
                    method=flow.request.method,
                    url=flow.request.url,
                    headers={},
                    data=None,
                ).prepare()
                self.signature_auth.__call__(signed_request)
                flow.request.headers["Signature"] = signed_request.headers["Signature"]
                flow.request.headers["Date"] = signed_request.headers["Date"]

                # ctx.log.info("Sent HTTP request with signature " + signed_request.headers["Signature"])
        except Exception as e:
            flow.response = http.HTTPResponse.make(
                500,
                f"mitmproxy failed:<br> {e}<br><br>{traceback.format_exc()}",
                {"Content-Type": "text/html"},
            )


test = os.getenv("WORKER_TEST", None) is not None

if test:
    # This is a test RSA private key and not used in any deployed environment
    # file deepcode ignore HardcodedNonCryptoSecret: <please specify a reason of ignoring this>
    private_key = """-----BEGIN RSA PRIVATE KEY-----
MIICXgIBAAKBgQDCFENGw33yGihy92pDjZQhl0C36rPJj+CvfSC8+q28hxA161QF
NUd13wuCTUcq0Qd2qsBe/2hFyc2DCJJg0h1L78+6Z4UMR7EOcpfdUE9Hf3m/hs+F
UR45uBJeDK1HSFHD8bHKD6kv8FPGfJTotc+2xjJwoYi+1hqp1fIekaxsyQIDAQAB
AoGBAJR8ZkCUvx5kzv+utdl7T5MnordT1TvoXXJGXK7ZZ+UuvMNUCdN2QPc4sBiA
QWvLw1cSKt5DsKZ8UETpYPy8pPYnnDEz2dDYiaew9+xEpubyeW2oH4Zx71wqBtOK
kqwrXa/pzdpiucRRjk6vE6YY7EBBs/g7uanVpGibOVAEsqH1AkEA7DkjVH28WDUg
f1nqvfn2Kj6CT7nIcE3jGJsZZ7zlZmBmHFDONMLUrXR/Zm3pR5m0tCmBqa5RK95u
412jt1dPIwJBANJT3v8pnkth48bQo/fKel6uEYyboRtA5/uHuHkZ6FQF7OUkGogc
mSJluOdc5t6hI1VsLn0QZEjQZMEOWr+wKSMCQQCC4kXJEsHAve77oP6HtG/IiEn7
kpyUXRNvFsDE0czpJJBvL/aRFUJxuRK91jhjC68sA7NsKMGg5OXb5I5Jj36xAkEA
gIT7aFOYBFwGgQAQkWNKLvySgKbAZRTeLBacpHMuQdl1DfdntvAyqpAZ0lY0RKmW
G6aFKaqQfOXKCyWoUiVknQJAXrlgySFci/2ueKlIE1QqIiLSZ8V8OlpFLRnb1pzI
7U1yQXnTAEFYM560yJlzUpOb1V4cScGd365tiSMvxLOvTA==
-----END RSA PRIVATE KEY-----"""

    public_key = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCFENGw33yGihy92pDjZQhl0C3
6rPJj+CvfSC8+q28hxA161QFNUd13wuCTUcq0Qd2qsBe/2hFyc2DCJJg0h1L78+6
Z4UMR7EOcpfdUE9Hf3m/hs+FUR45uBJeDK1HSFHD8bHKD6kv8FPGfJTotc+2xjJw
oYi+1hqp1fIekaxsyQIDAQAB
-----END PUBLIC KEY-----"""
    addons = [
        SignRequests(
            key_id="crossfeed",
            public_key=public_key,
            private_key=private_key,
            user_agent="Crossfeed test user agent",
        )
    ]
else:
    addons = [
        SignRequests(
            key_id="crossfeed",
            public_key=os.getenv("WORKER_SIGNATURE_PUBLIC_KEY", ""),
            private_key=os.getenv("WORKER_SIGNATURE_PRIVATE_KEY", ""),
            user_agent=os.getenv("WORKER_USER_AGENT", ""),
        )
    ]
