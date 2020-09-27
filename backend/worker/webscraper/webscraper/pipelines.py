# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem
import json
import os
from datetime import datetime


class ExportFilePipeline:
    def process_item(self, item, spider):
        output_dir = os.path.join("s3-data", item["s3_key"])
        if os.path.exists(output_dir):
            raise DropItem("Duplicate item found with s3_key: %s" % item["s3_key"])
        date_dir = os.path.join(output_dir, datetime.now().isoformat())
        latest_dir = os.path.join(output_dir, "latest")
        os.makedirs(date_dir, exist_ok=True)
        os.makedirs(latest_dir, exist_ok=True)

        body = item.pop("body")
        for directory in [date_dir, latest_dir]:
            with open(os.path.join(directory, "body.txt"), "w+") as f:
                f.write(body)
            with open(os.path.join(directory, "item.json"), "w+") as f:
                json.dump(dict(item), f)

        return item
