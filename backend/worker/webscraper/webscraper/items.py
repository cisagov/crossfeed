# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class Webpage(scrapy.Item):
    # define the fields for your item here like:
    url = scrapy.Field()
    s3_key = scrapy.Field()
    # headers = scrapy.Field()
    status = scrapy.Field()
    domain_name = scrapy.Field()
    # body = scrapy.Field()
