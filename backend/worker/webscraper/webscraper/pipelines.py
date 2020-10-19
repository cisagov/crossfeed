from scrapy.exceptions import DropItem
import json
import os
from io import BytesIO
from datetime import datetime


class ExportFilePipeline:
    """Prints file contents to the console."""

    def __init__(self, print=print):
        self.urls_seen = set()
        self.print = print

    def process_item(self, item, spider=None):
        if item["url"] in self.urls_seen:
            raise DropItem("Duplicate item found with url: %s" % item["url"])
        self.urls_seen.add(item["url"])
        self.print("database_output: " + json.dumps(item))
        return item
