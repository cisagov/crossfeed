---
title: Crossfeed Product Overview
sidenav: user-guide
---

Crossfeed is a self-service tool that continuously monitors an organization's public-facing attack surface. Users can use Crossfeed in order to view a snapshot of their organization's assets from an attacker's perspective and make informed risk decisions about their assets.

### Features

- Aggregates data from various public sources (Censys, Project Sonar, etc.) as well as performing custom enumeration techniques and indexing accessible services. All results are stored in a central database and made accessible for easy digestion.

- Supports self-service functionality, where users can sign in with their own accounts and then obtain scan results.

- Supports both passive and active scan types for organizations, which allows coordinating scans according to user comfort level.

- Enables asset analysis and visualizations, as well as user-specific dashboards.

### Potential use cases

With Crossfeed, an analyst can:

- Perform custom scanning for specific user assets such as login, admin, and registration pages.

- Automatically scan and notify users of vulnerabilities for newly-released CVEs related to Internet-facing services.

### Design details

Crossfeed is hosted in Amazon Web Services (AWS) and utilizes the [Serverless Framework](https://www.serverless.com/) to coordinate scans.

Tech Stack:

- Frontend: React (TypeScript)
- Backend: Node.js (TypeScript), Serverless Framework, PostgreSQL
- Scans: Node.js (TypeScript), runs in AWS Fargate and Lambda

For an architectural diagram and more information, see [Architecture](/dev/architecture/).

##### Security details

Crossfeed has been developed using modern software development practices such as continuous integration / continuous deployment and utilizes standard cloud security controls. Access controls are in place to ensure that only authorized users may view data on the Crossfeed platform, with authentication handled via Cognito or login.gov.

Crossfeed's scan data is collected entirely from open source information available to anyone on the Internet, and is stored on a cloud database that is in a private subnet and thus not directly accessible from the public Internet. The database is encrypted at rest through Amazon RDS.

### Data Sources

For Crossfeed scans, active and passive modes are defined as follows:

**Passive:** Querying data in a non-invasive manner. This includes querying an internal data source or third-party API, or light web traffic (e.g. visiting the index web page of a domain).

**Active:** Actively making network requests to target assets in order to identify vulnerabilities. All scans, even if used to detect vulnerabilities, are designed to not be disruptive and do not go beyond benign vulnerability payloads. This also includes more heavy traffic operations such as directory brute forcing.

Current data sources on the open source Crossfeed platform are listed below:

| Data Source                                                            | Status      | Operation Mode | Explanation                                                                                                                                                      |
| ---------------------------------------------------------------------- | ----------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Censys](https://censys.io/)                                           | Implemented | Passive        | Fetch passive port and banner data from censys ipv4 dataset                                                                                                      |
| [Shodan](https://www.shodan.io/)                                       | Implemented | Passive        | Querying internet-wide scan data from Shodan’s API                                                                                                               |
| [Findomain](https://github.com/Findomain/Findomain)                    | Implemented | Passive        | Open source tool that integrates passive APIs in order to discover target subdomains                                                                             |
| [Amass](https://github.com/OWASP/Amass)                                | Implemented | Active         | Open source tool that integrates passive APIs and active subdomain enumeration in order to discover target subdomains                                            |
| [Wappalyzer](https://github.com/AliasIO/wappalyzer)                    | Implemented | Passive        | Open source tool that fingerprints web technologies based on HTTP responses. Can be operated in passive mode given Censys data, or by directly scraping domains. |
| [NIST NVD](https://nvd.nist.gov/vuln/data-feeds)                       | Implemented | Passive        | Querying vulnerability information from NIST’s NVD API in order to identify vulnerabilities potentially associated with identified services                      |
| [Intrigue Ident](https://github.com/intrigueio/intrigue-ident/)        | Implemented | Passive        | Open source tool that fingerprints web technologies based on HTTP responses.                                                                                     |
| Web crawling                                                           | Implemented | Passive        | Crawling target websites in order to develop a site map and inform further scans                                                                                 |
| sslyze                                                                 | Implemented | Passive        | SSL certificate inspection to determine cert validity / expiration date                                                                                          |
| portscanner                                                            | Implemented | Active         | Active port scan of common ports                                                                                                                                 |
| [Have I been Pwned](https://haveibeenpwned.com/)                       | Implemented | Passive        | Look up information from the Have I been Pwned API to determine potentially compromised email addresses for any .gov domain                                      |
| [Dotgov](https://github.com/cisagov/dotgov-data)                       | Implemented | Passive        | Pulls domain names from the open .gov dataset                                                                                                                    |
| [DnsTwist](https://github.com/elceef/dnstwist)                         | Implemented | Passive        | Domain name permutation engine for detecting homograph phishing attacks, typo squatting, and brand impersonation potentially compromised email addresses         |
| [LookingGlass](https://lookingglasscyber.com/solution/scoutprime/)     | Implemented | Passive        | Look up Vulnerability & Malware information from the Looking Glass API                                                                                           |
| whois                                                                  | Implemented | Passive        | Looks up domain ownership / transfer information through whois APIs                                                                                              |
| [Project Nuclei](https://github.com/projectdiscovery/nuclei)           | In progress | Active         | Open source tool that allows confirming vulnerabilities by executing benign payloads                                                                             |
| [certspotter](https://github.com/SSLMate/certspotter)                  | Proposed    | Passive        | Monitor certificate transparency logs for given domains / subdomains                                                                                             |
| [Rapid7 Project Sonar](https://www.rapid7.com/research/project-sonar/) | Proposed    | Passive        | CSV export of passive DNS data used to discover additional subdomains                                                                                            |
| Metadata scraping                                                      | Proposed    | Passive        | Scraping common web metadata files (robots.txt, sitemap.xml, security.txt)                                                                                       |
| [Digital Analytics program](https://digital.gov/guides/dap/)           | Proposed    | Passive        | Querying the Digital Analytics Program published CSV file of live government domains                                                                             |
| [Findcdn](https://github.com/cisagov/findcdn)                          | Proposed    | Passive        | Open source tool that identifies if web services are operated behind a Content Delivery Network based on HTTP responses                                          |
