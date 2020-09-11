---
layout: page
title: Scanning FAQ
permalink: /scans/
---

### What is Crossfeed?

Crossfeed is an asset discovery tool that can be used to monitor and gather information about vulnerabilities on public-facing websites. Crossfeed is developed as an open-source tool, and its code is available on GitHub [here](https://github.com/cisagov/crossfeed).

### How can I verify that traffic is coming from CISA's instance of Crossfeed?

All requests sent from CISA's instance of Crossfeed (except for requests to third-party APIs) are sent with the following User-Agent:

```
Mozilla/5.0 (compatible; Crossfeed/1.0; +https://docs.crossfeed.cyber.dhs.gov/scans/)
```

All requests are also signed in order to allow verification that the request was actually sent from CISA Crossfeed. To verify a request, please note down the request URL, "Date" header and the "Signature" header, and send them to <a href="mailto:support@crossfeed.cyber.dhs.gov">support@crossfeed.cyber.dhs.gov</a>.

### Who can I contact with further questions?

Please contact <a href="mailto:support@crossfeed.cyber.dhs.gov">support@crossfeed.cyber.dhs.gov</a>.