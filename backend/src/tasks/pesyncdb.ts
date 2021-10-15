import { Client } from 'pg';
import { Handler } from 'aws-lambda';
import { readFileSync } from 'fs';

import { connectToDatabase } from '../models';
import * as path from 'path';

const PE_DATA_SCHEMA = `
-- From: https://github.com/cisagov/pe-reports/blob/8b0f0bcac64f0306ce804fad25d73efaa943fe93/src/pe_reports/data/data_schema.sql
--
-- PostgreSQL database dump
--

-- Draft Database Schema to store scan data
-- Includes Domain Masquerading, Credentals Exposed, Inffered Vulns, and Dark Web data


BEGIN;
-- Enable uuid extension in Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Organization Assets --
-- Organization's Table
CREATE TABLE IF NOT EXISTS public.organizations
(
    organizations_uid uuid default uuid_generate_v1() NOT NULL,
    name text NOT NULL,
    cyhy_db_name text,
    UNIQUE(name),
    PRIMARY KEY (organizations_uid)
);

-- Organization's Root Domains Table
CREATE TABLE IF NOT EXISTS public.root_domains
(
    root_domain_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization_name text NOT NULL,
    root_domain text NOT NULL,
    ip_address text,
    UNIQUE(root_domain, organizations_uid),
    PRIMARY KEY (root_domain_uid)
);

-- Organization's Sub Domains Table
CREATE TABLE IF NOT EXISTS public.sub_domains
(
    sub_domain_uid uuid default uuid_generate_v1() NOT NULL,
    sub_domain text NOT NULL,
    root_domain_uid uuid NOT NULL,
    root_domain text NOT NULL,
    UNIQUE(sub_domain, root_domain_uid),
    PRIMARY KEY (sub_domain_uid)
);

-- Organization's IPs Table
CREATE TABLE IF NOT EXISTS public.ip_addresses
(
    ip_address_uid uuid default uuid_generate_v1() NOT NULL,
    ip_address text NOT NULL,
    ip_type text,
    sub_domain_uid uuid NOT NULL,
    sub_domain text NOT NULL,
    PRIMARY KEY (ip_address_uid)
);

-- Organization's Aliases Table
CREATE TABLE IF NOT EXISTS public.alias
(
    alias_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    alias text NOT NULL,
    UNIQUE (alias),
    PRIMARY KEY (alias_uid)
);

-- Organization's Evecutives Table
CREATE TABLE IF NOT EXISTS public.executives
(
    executives_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    executives text NOT NULL,
    PRIMARY KEY (executives_uid)
);


-- Reporting Tables ----
-- Domain Masquerading Table
CREATE TABLE IF NOT EXISTS public."dnstwist_domain_masq"
(
    suspected_domain_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    "domain_permutation" text,
    "ipv4" text,
    "ipv6" text,
    "mail_server" text,
    "name_server" text,
    fuzzer text,
    "date_observed" date,
    "ssdeep_score" text,
    "malicious" boolean,
    "blocklist_attack_count" integer,
    "blocklist_report_count" integer,
    UNIQUE ("domain_permutation"),
    PRIMARY KEY (suspected_domain_uid)
);

-- Dark Web Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts
(
    alerts_uid uuid default uuid_generate_v1() NOT NULL,
    alert_name text,
    content text,
    date date,
    sixgill_id text,
    read text,
    severity text,
    site text,
    threat_level text,
    threats text,
    title text,
    user_id text,
    category text,
    lang text,
    UNIQUE (sixgill_id),
    organizations_uid uuid NOT NULL,
    PRIMARY KEY (alerts_uid)
);

-- Dark Web Mentions Table
CREATE TABLE IF NOT EXISTS public.mentions
(
    mentions_uid uuid default uuid_generate_v1() NOT NULL,
    category text,
    collection_date text,
    content text,
    creator text,
    date date,
    sixgill_mention_id text,
    post_id text,
    lang text,
    rep_grade text,
    site text,
    site_grade text,
    title text,
    type text,
    url text,
    comments_count text,
    sub_category text,
    tags text,
    UNIQUE (sixgill_mention_id),
    organizations_uid uuid NOT NULL,
    PRIMARY KEY (mentions_uid)
);

-- Shodan Insecure protocols and unverified vulnerabilities table
CREATE TABLE IF NOT EXISTS public.shodan_insecure_protocols_unverified_vulns
(
    insecure_product_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port integer,
    protocol text,
    type text,
    name text,
    potential_vulns text[],
    mitigation text,
    timestamp timestamp,
    product text,
    server text,
    tags text[],
    domains text[],
    hostnames text[],
    isn text,
    asn integer,
    UNIQUE (organizations_uid, ip, port, protocol, timestamp),
    PRIMARY KEY (insecure_product_uid)
);
--Shodan Veriried Vulnerabilities table
CREATE TABLE IF NOT EXISTS public.shodan_verified_vulns
(
    verified_vuln_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port text,
    protocol text,
    timestamp timestamp,
    cve text,
    severity text,
    cvss numeric,
    summary text,
    product text,
    attack_vector text,
    av_description text,
    attack_complexity text,
    ac_description text,
    confidentiality_impact text,
    ci_description text,
    integrity_impact text,
    ii_description text,
    availability_impact text,
    ai_description text,
    tags text[],
    domains text[],
    hostnames text[],
    isn text,
    asn integer,
    UNIQUE (organizations_uid, ip, port, protocol, timestamp),
    PRIMARY KEY (verified_vuln_uid)
);
--Shodan Assets and IPs table
CREATE TABLE IF NOT EXISTS public.shodan_assets
(
    shodan_asset_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port integer,
    protocol text,
    timestamp timestamp,
    product text,
    server text,
    tags text[],
    domains text[],
    hostnames text[],
    isn text,
    asn integer,
    UNIQUE (organizations_uid, ip, port, protocol, timestamp),
    PRIMARY KEY (shodan_asset_uid)
);

-- HIBP breaches Table
CREATE TABLE IF NOT EXISTS public.hibp_breaches
(
    hibp_breaches_uid uuid default uuid_generate_v1() NOT NULL,
    breach_name text NOT NULL,
    description text,
    exposed_cred_count bigint,
    breach_date date,
    added_date timestamp without time zone,
    modified_date timestamp without time zone,
    data_classes text[],
    password_included boolean,
    is_verified boolean,
    is_fabricated boolean,
    is_sensitive boolean,
    is_retired boolean,
    is_spam_list boolean,
    UNIQUE (breach_name),
    PRIMARY KEY (hibp_breaches_uid)
);

-- HIBP Exposed Credentials Table
CREATE TABLE IF NOT EXISTS public.hibp_exposed_credentials
(
    hibp_exposed_credentials_uid uuid default uuid_generate_v1() NOT NULL,
    email text NOT NULL,
    organizations_uid uuid NOT NULL,
    root_domain text,
    sub_domain text,
    breach_name text,
    modified_date timestamp without time zone,
	  breach_id uuid NOT NULL,
    UNIQUE (email, breach_name),
    PRIMARY KEY (hibp_exposed_credentials_uid)
);

-- Cyber Six Gill Exposed Credentials Table
CREATE TABLE IF NOT EXISTS public.cybersix_exposed_credentials
(
    csg_exposed_credentials_uid uuid default uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    breach_date date,
    breach_id integer,
    breach_name text NOT NULL,
    create_time text,
    description text,
    domain text,
    email text NOT NULL,
    password text,
    hash_type text,
    login_id text,
    name text,
    phone text,
    UNIQUE (email, breach_id),
    PRIMARY KEY (csg_exposed_credentials_uid)
);

-- Top CVEs
CREATE TABLE IF NOT EXISTS public.top_cves
(
    top_cves_uid uuid default uuid_generate_v1() NOT NULL,
    cve_id text,
    dynamic_rating text,
    nvd_base_score text,
    date date,
    UNIQUE (cve_id, date),
    PRIMARY KEY (top_cves_uid)
);

-- Table Relationships --
-- One to many relation between Organization and Root Domains
ALTER TABLE public.root_domains
 ADD FOREIGN KEY (organizations_uid)
 REFERENCES public.organizations (organizations_uid)
 NOT VALID;

 -- One to many relation between root domains and sub Domains
ALTER TABLE public.sub_domains
 ADD FOREIGN KEY (root_domain_uid)
 REFERENCES public.root_domains (root_domain_uid)
 NOT VALID;

 -- One to many relation between sub domains and IPs
ALTER TABLE public.ip_addresses
 ADD FOREIGN KEY (sub_domain_uid)
 REFERENCES public.sub_domains (sub_domain_uid)
 NOT VALID;

-- One to many relation between Organization and DNSTwist results
ALTER TABLE public."dnstwist_domain_masq"
 ADD FOREIGN KEY (organizations_uid)
 REFERENCES public.organizations (organizations_uid)
 NOT VALID;

-- One to many relation between Organization and Shodan Assets
ALTER TABLE public.shodan_assets
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and Shodan Unverified Vulns
ALTER TABLE public.shodan_insecure_protocols_unverified_vulns
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and Shodan Verified Vulns
ALTER TABLE public.shodan_verified_vulns
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Breaches and HIBP Exposed Credentials
ALTER TABLE public.hibp_exposed_credentials
    ADD FOREIGN KEY (breach_id)
    REFERENCES public.hibp_breaches (hibp_breaches_uid)
    NOT VALID;

-- One to many relation between Organization and HIBP Exposed Credentials
ALTER TABLE public.hibp_exposed_credentials
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and SixGill Exposed Credentials
ALTER TABLE public.cybersix_exposed_credentials
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and Aliases
ALTER TABLE public.alias
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and Executives
ALTER TABLE public.executives
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to many relation between Organization and SixGill Alert API
ALTER TABLE public.alerts
    ADD FOREIGN KEY (organizations_uid)
    REFERENCES public.organizations (organizations_uid)
    NOT VALID;

-- One to Many Relationship for Mentions
-- Represented in complex SixGill "query": API.

-- Views --
-- HIBP complete breach view
Create View vw_breach_complete
AS
SELECT creds.hibp_exposed_credentials_uid,creds.email, creds.breach_name, creds.organizations_uid, creds.root_domain, creds.sub_domain,
    b.description, b.breach_date, b.added_date, b.modified_date,  b.data_classes,
    b.password_included, b.is_verified, b.is_fabricated, b.is_sensitive, b.is_retired, b.is_spam_list

    FROM hibp_exposed_credentials as creds

    JOIN hibp_breaches as b
    ON creds.breach_id = b.hibp_breaches_uid;

END;
`;

/*
 * Generates initial P&E database.
 */

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase();

  // Create P&E database and user.
  try {
    await connection.query(
      `CREATE USER ${process.env.PE_DB_USERNAME} WITH PASSWORD '${process.env.PE_DB_PASSWORD}';`
    );
  } catch (e) {
    console.log(
      "Create user failed. This usually means that the user already exists, so you're OK if that was the case. Here's the exact error:",
      e
    );
  }
  try {
    await connection.query(
      `GRANT ${process.env.PE_DB_USERNAME} to ${process.env.DB_USERNAME};`
    );
  } catch (e) {
    console.log('Grant role failed. Error:', e);
  }
  try {
    await connection.query(
      `CREATE DATABASE ${process.env.PE_DB_NAME} owner ${process.env.PE_DB_USERNAME};`
    );
  } catch (e) {
    console.log(
      "Create database failed. This usually means that the database already exists, so you're OK if that was the case. Here's the exact error:",
      e
    );
  }

  // Connect to the PE database.
  const client = new Client({
    user: process.env.PE_DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.PE_DB_NAME,
    password: process.env.PE_DB_PASSWORD
  });
  client.connect();

  // Drop all tables in the PE database.
  await client.query(`drop owned by ${process.env.PE_DB_USERNAME}`);

  // Generate initial PE tables.
  const sql = String(PE_DATA_SCHEMA);
  await client.query(sql);

  console.log('Done.');
  client.end();
};
