import scrapy
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from urllib.parse import urlparse
import hashlib
import json


class MainSpider(CrawlSpider):
    name = "main"

    rules = (Rule(LinkExtractor(), callback="parse_item", follow=True),)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        with open(self.domains_file, "r") as f:
            self.start_urls = f.read().split("\n")
        self.allowed_domains = [urlparse(url).netloc for url in self.start_urls]

    def parse_start_url(self, response):
        return self.parse_item(response)

    def parse_item(self, response):
        try:
            body_decoded = response.body.decode()
        except UnicodeDecodeError:
            body_decoded = "<binary>"

        headers = []
        for name, values in response.headers.items():
            for value in values:
                headers.append({"name": name.decode(), "value": value.decode()})

        item = dict(
            status=response.status,
            url=response.url,
            domain_name=urlparse(response.url).netloc,
            body=body_decoded,
            response_size=len(response.body),
            headers=headers,
        )
        yield item
