---
title: Quickstart
sidenav: user-guide
---

### Accepting an Invite

Standard users of Crossfeed can only access the platform after being invited to
an organization by another user. When invited, you will receive an email invite
to a Crossfeed organization. You will then be prompted to create a user account.

### Overview

Once you are logged in, you can view an overview of your organization's domains
and risk summary on the "Overview" pane.

![dashboard](./img/dashboard.png)

### View assets

You can search for anything, which returns search results, then filter those results. Each search result represents a domain, which can have ports, products, and vulnerabilities associated with it.

![search results](./img/search results.png)

The "All Domains" list contains a more compact representation of all domains.

![domain list](./img/domain list.png)

The "All Vulnerabilities" list has a list of all vulnerabilities. Each vulnerability is associated with a specific domain; vulnerabilities include CVEs as well as other issues such as SSL configuration or misconfiguration errors.

![vuln list](./img/vuln list.png)

You can also view details of an individual domain.

![domain detail](./img/domain detail.png)

Finally, you can click on a vulnerability to view more information about it, such as references to links with more information about it, as well as its history and any notes that other Crossfeed users may have added to it.

![vuln detail](./img/vuln detail.png)

### Management

Administrators have a few additional options for management. All data and users are organized into **organizations** in Crossfeed.

![org list](./img/org list.png)

Each organization has a list of root domains configured, which defines the scope of the assets under it, and can have users (with role either `admin` or `user`) assigned to it.

![org detail](./img/org detail.png)

The "Manage Users" screen lets you manage all users who have access to Crossfeed, across all organizations.

![user list](./img/user list.png)

Finally, you can view configured scans on the "Scans" tab. These scans allow you to configure the different data sources that feed into Crossfeed.

![scan list](./img/scan list.png)

<!-- Once you are logged in, you can view the domains of your organization on the
"Dashboard" page. The dashboard shows all domains and subdomains pertaining
to the user's current organization and shows the detected services for each domain. -->
