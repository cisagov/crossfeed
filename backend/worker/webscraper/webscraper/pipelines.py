# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


from scrapy.exceptions import DropItem
import json
import os
from io import BytesIO
from datetime import datetime

class ExportFilePipeline:
    """Prints file contents.
    """
    def __init__(self):
        self.urls_seen = set()
    
    def process_item(self, item, spider):
        if item["url"] in self.urls_seen:
            raise DropItem("Duplicate item found with url: %s" % item["url"])
        self.urls_seen.add(item["url"])
        print("database_output: " + json.dumps(item))
        return item
