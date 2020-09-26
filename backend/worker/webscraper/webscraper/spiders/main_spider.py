import scrapy
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from webscraper.items import Webpage
from urllib.parse import urlparse
import hashlib
import json
import os
from datetime import datetime

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

    # def start_requests(self):
    #     # domains_file is an input
    #     with open(self.domains_file, "r") as f:
    #         urls = f.read().split("\n")
    #     for url in urls:
    #         yield scrapy.Request(url=url, callback=self.parse)

    def parse_start_url(self, response):
        return self.parse_item(response)

    def parse_item(self, response):
        s3_key = hashlib.sha256(response.url.encode()).hexdigest()


        item = Webpage(
            s3_key=s3_key,
            status=response.status,
            url=response.url
        )
        yield item


        output_dir = os.path.join("s3_output", s3_key)
        date_dir = os.path.join(output_dir, datetime.now().isoformat())
        latest_dir = os.path.join(output_dir, "latest")
        os.makedirs(date_dir, exist_ok=True)
        os.makedirs(latest_dir, exist_ok=True)

        for directory in [date_dir, latest_dir]:
            with open(os.path.join(directory, "body.txt"), "w+") as f:
                f.write(response.body.decode())
            with open(os.path.join(directory, "item.json"), "w+") as f:
                json.dump(item, f)
        
        #, body=response.body.decode())