import scrapy
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from webscraper.items import Webpage
from urllib.parse import urlparse
import hashlib
import json

def convert(data):
    """Recursively converts all bytestrings to strings in a dictionary.
    From https://stackoverflow.com/a/33137796
    """
    if isinstance(data, list):  return list(map(convert, data))
    if isinstance(data, bytes):  return data.decode()
    if isinstance(data, dict):   return dict(map(convert, data.items()))
    if isinstance(data, tuple):  return list(map(convert, data))
    return data

class MainSpider(CrawlSpider):
    name = "main"

    rules = (
        Rule(LinkExtractor(), callback='parse_item', follow=True),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        with open(self.domains_file, "r") as f:
            self.start_urls = f.read().split("\n")
        self.allowed_domains = [urlparse(url).netloc for url in self.start_urls]

    def parse_start_url(self, response):
        return self.parse_item(response)

    def parse_item(self, response):
        s3_key = hashlib.sha256(response.url.encode()).hexdigest()

        item = Webpage(
            s3_key=s3_key,
            status=response.status,
            url=response.url,
            domain_name=urlparse(response.url).netloc,
            body=response.body,
            response_size=len(response.body),
            headers=response.headers
        )
        yield item
        
        #, body=response.body.decode())