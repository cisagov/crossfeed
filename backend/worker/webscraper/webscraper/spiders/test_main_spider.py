import pytest
from .main_spider import MainSpider
from scrapy.http import Response, Request
from tempfile import NamedTemporaryFile
import json

SAMPLE_HEADERS = {
    "Server": "Apache",
    "X-Content-Type-Options": "nosniff, nosniff",
    "Link": '<https://www.cisa.gov/>; rel="shortlink", <https://www.cisa.gov/>; rel="canonical", <https://www.cisa.gov/home>; rel="revision"',
    "X-UA-Compatible": "IE=edge",
    "Content-Language": "en",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Generator": "Drupal 8 (https://www.drupal.org)",
    "Content-Type": "text/html; charset=UTF-8",
    "Vary": "Accept-Encoding",
    "Content-Encoding": "gzip",
    "Cache-Control": "private, no-cache, must-revalidate",
    "Expires": "Sun, 18 Oct 2020 00:08:03 GMT",
    "Date": "Sun, 18 Oct 2020 00:08:03 GMT",
    "Content-Length": "15726",
    "Connection": "keep-alive",
    "Strict-Transport-Security": "max-age=31536000 ; includeSubDomains",
}


@pytest.fixture
def spider():
    with NamedTemporaryFile() as f:
        return MainSpider(domains_file=f.name)


def test_sample_website(spider):
    response = Response(
        url="https://www.cisa.gov",
        request=Request(url="https://www.cisa.gov"),
        body="<body>Hello world</body>".encode(),
        headers=SAMPLE_HEADERS,
    )
    results = list(spider.parse_item(response))
    assert results == [
        {
            "status": 200,
            "url": "https://www.cisa.gov",
            "domain_name": "www.cisa.gov",
            "body": "<body>Hello world</body>",
            "response_size": 24,
            "headers": [
                {"name": "Server", "value": "Apache"},
                {"name": "X-Content-Type-Options", "value": "nosniff, nosniff"},
                {
                    "name": "Link",
                    "value": '<https://www.cisa.gov/>; rel="shortlink", <https://www.cisa.gov/>; rel="canonical", <https://www.cisa.gov/home>; rel="revision"',
                },
                {"name": "X-Ua-Compatible", "value": "IE=edge"},
                {"name": "Content-Language", "value": "en"},
                {"name": "X-Frame-Options", "value": "SAMEORIGIN"},
                {"name": "X-Generator", "value": "Drupal 8 (https://www.drupal.org)"},
                {"name": "Content-Type", "value": "text/html; charset=UTF-8"},
                {"name": "Vary", "value": "Accept-Encoding"},
                {"name": "Content-Encoding", "value": "gzip"},
                {
                    "name": "Cache-Control",
                    "value": "private, no-cache, must-revalidate",
                },
                {"name": "Expires", "value": "Sun, 18 Oct 2020 00:08:03 GMT"},
                {"name": "Date", "value": "Sun, 18 Oct 2020 00:08:03 GMT"},
                {"name": "Content-Length", "value": "15726"},
                {"name": "Connection", "value": "keep-alive"},
                {
                    "name": "Strict-Transport-Security",
                    "value": "max-age=31536000 ; includeSubDomains",
                },
            ],
        }
    ]

    # Make sure this doesn't give an error; this can fail if the response has any binary values.
    json.dumps(results)
