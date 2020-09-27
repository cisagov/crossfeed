---
title: Architecture
permalink: /contributing/architecture/

layout: post
sidenav: contributing
subnav:
  - text: Overall architecture
    href: '#overall-architecture'
  - text: Worker architecture
    href: '#worker-architecture'
  - text: Search architecture
    href: '#search-architecture'
---

## Overall architecture

<!--

To edit this graph, view this page in a browser, click on the graph, and click the "edit" button to view it in draw.io.

Once you've made changes, click File -> Embed -> HTML to get the new architecture HTML code, then put it in architecture-diagram.md.

-->

{% include_relative architecture-diagram.md %}

## Worker architecture

The `Scan` model represents a scheduled scan that is run on all organizations.
A scan can be of multiple types -- for example, `amass` , or `findomain` .

First, add an organization:

![add organization](https://github.com/cisagov/crossfeed/raw/62b27371d4a33f104452967dde1a85d1946da6c8/docs/img/add%20organization.png)

Then, add a scan:

![add scan](https://github.com/cisagov/crossfeed/raw/62b27371d4a33f104452967dde1a85d1946da6c8/docs/img/add%20scan.png)

### Scheduling

The lambda function `scheduler.ts` goes through each organization and sees which scans
need to be run based on their schedule and when they were last run on a particular organization.

### Running

When a scan is run, a `ScanTask` model is created, which launches a Fargate task.

All information needed for the scan (defined in the `CommandOptions` interface) is specified
through the `CROSSFEED_COMMAND_OPTIONS` environment variable. Other secrets needed for the Fargate
task to run are specified in the task configuration through Terraform.

The entry point for the Fargate task is at `backend/src/worker.ts` .

![fargate task](https://github.com/cisagov/crossfeed/raw/62b27371d4a33f104452967dde1a85d1946da6c8/docs/img/fargate%20task.png)

#### Local runs

When running Crossfeed locally, each worker is launched through a Docker container instead.

To inspect tasks that are running (and have recently finished), do `docker ps -a > out` and inspect the contents of `out` :

![docker ps](https://github.com/cisagov/crossfeed/raw/62b27371d4a33f104452967dde1a85d1946da6c8/docs/img/docker%20ps.png)

Note that each Docker container is identified by organization name and scan name.

To view the logs of a particular Docker container, you can run `docker logs crossfeed_worker_cisa_censys_8358453` .

### ScanTask

The `ScanTask` model represents a single scan task on a single organization and stores the status
and errors, if any, of that particular task.

You can view the most recent Scan Tasks on the organization page:

![scan tasks](https://github.com/cisagov/crossfeed/raw/62b27371d4a33f104452967dde1a85d1946da6c8/docs/img/scan%20tasks.png)

#### ScanTask status reference

- `created` : model is created
- `requested` : a request to Fargate has been sent to start the task
- `started` : the Fargate container has started running the task
- `finished` : the Fargate container has finished running the task
- `failed` : any of the steps above have failed

### Building Docker images

For more information on how to build and publish the Fargate Docker images, see `backend/README.md` .

## Search architecture

We use an Elasticsearch cluster to power search. All data is populated to the database by other scans, and synchronization between the database and Elasticsearch is done by the `searchSync` scan.

The `searchSync` scan retrieves all domains / services / vulnerabilities / webpages that need to be synced to Elasticsearch, then bulk
uploads them to Elasticsearch. Afterwards, it sets the `syncedAt` column on these entities so that they will not be synced again in the future,
until they are updated by other scans.

### Indexes and mapping

We use a single index called "domains"; its name might change due to reindexing, so the current name is stored as the DOMAINS_INDEX constant in [es-client.ts](https://github.com/cisagov/crossfeed/blob/b55f36c0808feede82ffd8ad9473b2768e56a511/backend/src/tasks/es-client.ts#L4).

The domain index has a mapping. In order to create or update the mapping, you can run `npm run syncdb` from the `backend` directory. This calls
the `ESClient.syncDomainsIndex()`, which will update the index's mapping if it exists, or create a new index if it doesn't exist.

Both `services` and `vulnerabilities` are stored with the
[nested field type](https://www.elastic.co/guide/en/elasticsearch/reference/7.9/nested.html). This means that they are all stored on the same domain
document, and adding services / vulnerabilities will require updating / reindexing of an entire domain document.

However, `webpages` are stored with the [join field type](https://www.elastic.co/guide/en/elasticsearch/reference/7.9/parent-join.html). This means
that each webpage is stored as a separate document in the "domains" index, but contains a value for the `parent_join` field that indicates that
that webpage is a child of another domain document. This makes it more efficient to add or remove single webpages, since it doesn't require
reindexing all the webpages for a given domain.

So that the webpage fields don't conflict with fields in regular parent domain records, fields in webpage records are stored with the
`webpage_` prefix
([see schema here](https://github.com/cisagov/crossfeed/blob/b55f36c0808feede82ffd8ad9473b2768e56a511/backend/src/tasks/es-client.ts#L11)).

### Searching

The search query is built by the [buildRequest](https://github.com/cisagov/crossfeed/blob/33fcaf4cb730974bf3d5ee61b80d13a2c675bd80/frontend/src/pages/Search/SearchProvider/buildRequest.js#L56) function on the frontend. As of now, the logic there roughly corresponds to:

```
(
  (
    (has a domain matching query) OR
    (has a webpage with body matching query)
  )
  AND (matches filters)
)
```

Search results are individual domains, but they may contain snippets of webpage bodies if they contain the webpage content. For example:

![search result](https://github.com/cisagov/crossfeed/raw/68d7f20b0c2bc951d625d40a8a62c5b49f4306b2/docs/contributing/img/search%20result.png)

## Webpage scraping

Webpage scraping is done by the `webscraper` scan. This scan uses the `scrapy` Python library to follow and scrape all links, observing
rate limits and respecting robots.txt as well.

When a webpage is scraped, basic information such as the URL and status code are stored in the database through the `Webpage` model. However,
webpage contents are not stored in the database; instead, they are uploaded to S3. The S3 directory is structured as follows
(below is a local directory, which is then copied to S3):

![webpage structure](https://github.com/cisagov/crossfeed/raw/cfcfba2cc736c39a5f241a64ce75428782062862/docs/contributing/img/webpage%20structure.png)

Essentially, each webpage is stored in a folder with a name equal to a hash of its URL (this name is also stored in the `s3Key`
attribute of the `Webpage` model). Inside this folder are folders with timestamps corresponding to each scan, as well as a `latest`
folder for the information for the latest scan.

In each subfolder, `body.txt` contains the response contents, while `info.json` contains basic metadata about the webpage
(URL, status code). In the future, these subfolders will also store screenshots and other large information.

When `searchSync` runs, for each webpage that needs to be synced, it reads from `latest/body.txt` and sets this to the contents of
`webpage_body` in the object that is finally uploaded to Elasticsearch. This means that while Elasticsearch contains all webpage
contents, it uses S3 as a source of truth for the webpage body but the database as a source of truth for the webpage paths /
other info.