# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem
import json
import os
from io import BytesIO
from datetime import datetime

class ExportFilePipeline:
    """Prints file contents.
    """
    
    def process_item(self, item, spider):

        output_dir_key = item["s3_key"]
        date_dir_key = os.path.join(output_dir_key, datetime.now().isoformat())
        latest_dir_key = os.path.join(output_dir_key, "latest")

        print("database_output: " + json.dumps(dict(item)))

        return item
