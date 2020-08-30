from mitmproxy import exceptions
from mitmproxy.test import tflow
from mitmproxy.test import taddons
from .mitmproxy_sign_requests import SignRequests
import pytest

def test_user_agent_and_signature():
    sr = SignRequests(key_id="crossfeed", key_secret="secret", user_agent="custom user agent")
    with taddons.context() as tctx:
        f = tflow.tflow()
        f.request.headers["User-Agent"] = "original user agent"
        sr.request(f)
        assert f.request.headers["User-Agent"] == "custom user agent"
        sr.verify_signature(method=f.request.method, url=f.request.url, date=f.request.headers["Date"], signature=f.request.headers["Signature"])

def test_no_user_agent_or_signature_set():
    sr = SignRequests(key_id="", key_secret="", user_agent="")
    with taddons.context() as tctx:
        f = tflow.tflow()
        sr.request(f)
        assert "User-Agent" not in f.request.headers
        assert "Date" not in f.request.headers
        assert "Signature" not in f.request.headers