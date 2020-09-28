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
import boto3

class ExportFilePipeline:
    """Exports files to S3.
    """

    def __init__(self):
        self.s3_keys_seen = set()
        if os.getenv("IS_LOCAL"):
            self.s3 = boto3.resource('s3', endpoint_url='http://minio:9000')
        else:
            self.s3 = boto3.resource('s3')
        self.bucket = self.s3.Bucket(os.getenv("WEBSCRAPER_S3_BUCKET_NAME", "webscraper-local"))
    
    def process_item(self, item, spider):
        if item["s3_key"] in self.s3_keys_seen:
            raise DropItem("Duplicate item found with s3_key: %s" % item["s3_key"])
        self.s3_keys_seen.add(item["s3_key"])

        output_dir_key = item["s3_key"]
        date_dir_key = os.path.join(output_dir_key, datetime.now().isoformat())
        latest_dir_key = os.path.join(output_dir_key, "latest")

        def upload_to_s3(fileobj, filename):
            """Uploads a file to S3, both in the date directory and the latest directory."""
            self.bucket.upload_fileobj(BytesIO(body), os.path.join(date_dir_key, filename))
            self.bucket.copy({'Bucket': self.bucket.name, 'Key': os.path.join(date_dir_key, filename)}, os.path.join(latest_dir_key, filename))
        
        body = item.pop("body")
        upload_to_s3(fileobj=BytesIO(body), filename="body.txt")
        upload_to_s3(fileobj=BytesIO(json.dumps(dict(item)).encode()), filename="item.json")

        print("database_output: " + json.dumps(dict(item)))

        return item
