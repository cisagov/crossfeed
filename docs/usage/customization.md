---
title: Customization
permalink: /usage/customization/

layout: post
sidenav: usage
# subnav:
#   - text: Access control
#     href: '#access-control'
#   - text: Global admins
#     href: '#global-admins'
#   - text: Organization admins
#     href: '#organization-admins'
---

## Creating your own instance of Crossfeed

When you create your own instance of Crossfeed, you can customize many aspects of how it looks.

The `dev.env.example` file contains a full list of all customizable variables.

## User Agent requests

Crossfeed's workers, when performing requets, can optionally send a User Agent identifying the requestor as Crossfeed
and a `Signature` header to verify that Crossfeed is performing the request.

To do this, you can set the `WORKER_USER_AGENT` and the `WORKER_SIGNATURE_SECRET` parameters in your env file:

```
WORKER_USER_AGENT="Crossfeed (Test request from Crossfeed Staging Environment, for development use only. For more information, see https://github.com/cisagov/crossfeed)"
WORKER_SIGNATURE_SECRET="secret123"
```

One can then verify that requests are coming from Crossfeed by providing you with the following parts of the request:
- Value of the `Date` header
- Value of the `Signature` header
- Request method
- Request URL

You can call the `SignRequests.verify_signature` method (found in `backend/worker/mitmproxy_sign_requests.py`) to verify a signature with
the above four parts of a request. Crossfeed will later have an admin UI that allows admins to run this check directly from the web interface.

Note that when deploying Crossfeed to AWS, the worker signature secret should also be set as an SSM secret (such as `/crossfeed/staging/WORKER_SIGNATURE_SECRET`).