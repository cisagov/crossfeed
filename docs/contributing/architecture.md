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
---

## Overall architecture

<!--

To modify the architecture, use [https://app.diagrams.net/](https://app.diagrams.net/) or the desktop app

to open architecture.drawio.

-->

![Architecture](/contributing/architecture.png)

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
