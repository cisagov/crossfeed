---
title: Matomo
sidenav: dev
---

[Matomo](https://matomo.org/) is an open source analytics platform.
We host an instance of Matomo as part of Crossfeed to collect analytics on its usage.

Matomo requires both an instance to host it and a MariaDB database.
When running Matomo locally, we run it using the `crossfeed_matomo_1`
and `crossfeed_matomodb_1` Docker containers. When deployed, we run
Matomo on AWS Fargate and use RDS to host the Matomo DB instance.

Only `globalAdmin` users can currently access Matomo. When accessing Matomo, you must use
a separate shared username and password (in addition to the standard global admin authentication).

### Directory structure

The file `infrastructure/matomo.tf` contains the Terraform infrastructure needed for deploying Matomo.

### Setting up Matomo locally

Before you run Matomo for the first time locally, you must run `./setup-matomo.sh`.

You can access Matomo by clicking on the "Matomo" button from the "My Account" page. Click
through the original setup (keep the default values for database connection, etc.),
then set the superuser username and password to "root" and "password" (for development only; for deployment to production, you should generate a random password).

### Matomo proxy

The deployed Matomo instance isn't directly accessible to the Internet. Instead, all paths to the REST API
that begin with `/matomo` are proxied to the Matomo instance. The JWT stored in the `crossfeed-token`
cookie is checked to ensure that the user is a global admin before the API proxies the user's request.
