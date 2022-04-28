import { Client } from 'pg';
import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';

/*
 * Generates initial P&E database.
 */

const PE_DATA_SCHEMA = `
-- From: https://github.com/cisagov/pe-reports/blob/8b0f0bcac64f0306ce804fad25d73efaa943fe93/src/pe_reports/data/data_schema.sql
--
-- PostgreSQL database dump
--
-- Draft Database Schema to store scan data
-- Includes Domain Masquerading, Credentals Exposed, Inffered Vulns, and Dark Web data

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

--
-- Name: Users; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    email character varying(64),
    username character varying(64),
    admin integer,
    role integer,
    password_hash character varying(128),
    api_key character varying(128)
);

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.alerts (
    alerts_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
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
    organizations_uid uuid NOT NULL,
    data_source_uid uuid NOT NULL
);


--
-- Name: alias; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.alias (
    alias_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    alias text NOT NULL
);


--
-- Name: asset_headers; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.asset_headers (
    _id uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    sub_url text NOT NULL,
    tech_detected text[] NOT NULL,
    interesting_header text[] NOT NULL,
    ssl2 text[],
    tls1 text[],
    certificate json,
    scanned boolean,
    ssl_scanned boolean
);

--
-- Name: credential_breaches; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.credential_breaches (
    credential_breaches_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
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
    data_source_uid uuid NOT NULL
);

--
-- Name: credential_exposures; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.credential_exposures (
    credential_exposures_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    email text NOT NULL,
    organizations_uid uuid NOT NULL,
    root_domain text,
    sub_domain text,
    breach_name text,
    modified_date timestamp without time zone,
    credential_breaches_uid uuid NOT NULL,
    data_source_uid uuid NOT NULL,
    name text,
    login_id text,
    phone text,
    password text,
    hash_type text
);

--
-- Name: cybersix_exposed_credentials; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.cybersix_exposed_credentials (
    csg_exposed_credentials_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    breach_date date,
    breach_id integer,
    breach_name text NOT NULL,
    create_time timestamp without time zone,
    description text,
    domain text,
    email text NOT NULL,
    password text,
    hash_type text,
    login_id text,
    name text,
    phone text,
    data_source_uid uuid NOT NULL
);

--
-- Name: cyhy_db_assets; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.cyhy_db_assets (
    _id uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    org_id text,
    org_name text,
    contact text,
    network inet,
    type text
);

--
-- Name: data_source; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.data_source (
    data_source_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    last_run date NOT NULL
);

--
-- Name: domain_alerts; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.domain_alerts (
    domain_alert_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    sub_domain_uid uuid NOT NULL,
    data_source_uid uuid NOT NULL,
    organizations_uid uuid NOT NULL,
    alert_type text,
    message text,
    previous_value text,
    new_value text,
    date date
);

--
-- Name: domain_permutations; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.domain_permutations (
    suspected_domain_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    domain_permutation text,
    ipv4 text,
    ipv6 text,
    mail_server text,
    name_server text,
    fuzzer text,
    date_observed date,
    ssdeep_score text,
    malicious boolean,
    blocklist_attack_count integer,
    blocklist_report_count integer,
    data_source_uid uuid NOT NULL,
    sub_domain_uid uuid
);

--
-- Name: executives; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.executives (
    executives_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    executives text NOT NULL
);

--
-- Name: mentions; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.mentions (
    mentions_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
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
    organizations_uid uuid NOT NULL,
    data_source_uid uuid NOT NULL
);

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.organizations (
    organizations_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    name text NOT NULL,
    cyhy_db_name text
);

--
-- Name: pshtt_results; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.pshtt_results (
    pshtt_results_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    sub_domain_uid uuid NOT NULL,
    data_source_uid uuid NOT NULL,
    sub_domain text NOT NULL,
    scanned boolean,
    base_domain text,
    base_domain_hsts_preloaded boolean,
    canonical_url text,
    defaults_to_https boolean,
    domain text,
    domain_enforces_https boolean,
    domain_supports_https boolean,
    domain_uses_strong_hsts boolean,
    downgrades_https boolean,
    htss boolean,
    hsts_entire_domain boolean,
    hsts_header text,
    hsts_max_age numeric,
    hsts_preload_pending boolean,
    hsts_preload_ready boolean,
    hsts_preloaded boolean,
    https_bad_chain boolean,
    https_bad_hostname boolean,
    https_cert_chain_length integer,
    https_client_auth_required boolean,
    https_custom_truststore_trusted boolean,
    https_expired_cert boolean,
    https_full_connection boolean,
    https_live boolean,
    https_probably_missing_intermediate_cert boolean,
    https_publicly_trusted boolean,
    https_self_signed_cert boolean,
    ip inet,
    live boolean,
    notes text,
    redirect boolean,
    redirect_to text,
    server_header text,
    server_version text,
    strictly_forces_https boolean,
    unknown_error boolean,
    valid_https boolean,
    ep_http_headers json,
    ep_http_ip inet,
    ep_http_live boolean,
    ep_http_notes text,
    ep_http_redirect boolean,
    ep_http_redirect_eventually_to text,
    ep_http_redirect_eventually_to_external boolean,
    ep_http_redirect_eventually_to_http boolean,
    ep_http_redirect_eventually_to_https boolean,
    ep_http_redirect_eventually_to_subdomain boolean,
    ep_http_redirect_immediately_to text,
    ep_http_redirect_immediately_to_external boolean,
    ep_http_redirect_immediately_to_http boolean,
    ep_http_redirect_immediately_to_https boolean,
    ep_http_redirect_immediately_to_subdomain boolean,
    ep_http_redirect_immediately_to_www boolean,
    ep_http_server_header text,
    ep_http_server_version text,
    ep_http_status integer,
    ep_http_unknown_error boolean,
    ep_http_url text,
    ep_https_headers json,
    ep_https_hsts boolean,
    ep_https_hsts_all_subdomains boolean,
    ep_https_hsts_header text,
    ep_https_hsts_max_age numeric,
    ep_https_hsts_preload boolean,
    ep_https_https_bad_chain boolean,
    ep_https_https_bad_hostname boolean,
    ep_https_https_cert_chain_len integer,
    ep_https_https_client_auth_required boolean,
    ep_https_https_custom_trusted boolean,
    ep_https_https_expired_cert boolean,
    ep_https_https_vull_connection boolean,
    ep_https_https_missing_intermediate_cert boolean,
    ep_https_https_public_trusted boolean,
    ep_https_https_self_signed_cert boolean,
    ep_https_https_valid boolean,
    ep_https_ip inet,
    ep_https_live boolean,
    ep_https_notes text,
    ep_https_redirect boolean,
    ep_https_redireect_eventually_to text,
    ep_https_redirect_eventually_to_external boolean,
    ep_https_redirect_eventually_to_http boolean,
    ep_https_redirect_eventually_to_https boolean,
    ep_https_redirect_eventually_to_subdomain boolean,
    ep_https_redirect_immediately_to text,
    ep_https_redirect_immediately_to_external boolean,
    ep_https_redirect_immediately_to_http boolean,
    ep_https_redirect_immediately_to_https boolean,
    ep_https_redirect_immediately_to_subdomain boolean,
    ep_https_redirect_immediately_to_www boolean,
    ep_https_server_header text,
    ep_https_server_version text,
    ep_https_status integer,
    ep_https_unknown_error boolean,
    ep_https_url text,
    ep_httpswww_headers json,
    ep_httpswww_hsts boolean,
    ep_httpswww_hsts_all_subdomains boolean,
    ep_httpswww_hsts_header text,
    ep_httpswww_hsts_max_age numeric,
    ep_httpswww_hsts_preload boolean,
    ep_httpswww_https_bad_chain boolean,
    ep_httpswww_https_bad_hostname boolean,
    ep_httpswww_https_cert_chain_len integer,
    ep_httpswww_https_client_auth_required boolean,
    ep_httpswww_https_custom_trusted boolean,
    ep_httpswww_https_expired_cert boolean,
    ep_httpswww_https_full_connection boolean,
    ep_httpswww_https_missing_intermediate_cert boolean,
    ep_httpswww_https_public_trusted boolean,
    ep_httpswww_https_self_signed_cert boolean,
    ep_httpswww_https_valid boolean,
    ep_httpswww_ip inet,
    ep_httpswww_live boolean,
    ep_httpswww_notes text,
    ep_httpswww_redirect boolean,
    ep_httpswww_redirect_eventually_to text,
    ep_httpswww_redirect_eventually_to_external boolean,
    ep_httpswww_redirect_eventually_to_http boolean,
    ep_httpswww_redirect_eventually_to_https boolean,
    ep_httpswww_redirect_eventually_to_subdomain boolean,
    ep_httpswww_redirect_immediately_to text,
    ep_httpswww_redirect_immediately_to_external boolean,
    ep_httpswww_redirect_immediately_to_http boolean,
    ep_httpswww_redirect_immediately_to_https boolean,
    ep_httpswww_redirect_immediately_to_subdomain boolean,
    ep_httpswww_redirect_immediately_to_www boolean,
    ep_httpswww_server_header text,
    ep_httpswww_server_version text,
    ep_httpswww_status integer,
    ep_httpswww_unknown_error boolean,
    ep_httpswww_url text,
    ep_httpwww_headers json,
    ep_httpwww_ip inet,
    ep_httpwww_live boolean,
    ep_httpwww_notes text,
    ep_httpwww_redirect boolean,
    ep_httpwww_redirect_eventually_to text,
    ep_httpwww_redirect_eventually_to_external boolean,
    ep_httpwww_redirect_eventually_to_http boolean,
    ep_httpwww_redirect_eventually_to_https boolean,
    ep_httpwww_redirect_eventually_to_subdomain boolean,
    ep_httpwww_redirect_immediately_to text,
    ep_httpwww_redirect_immediately_to_external boolean,
    ep_httpwww_redirect_immediately_to_http boolean,
    ep_httpwww_redirect_immediately_to_https boolean,
    ep_httpwww_redirect_immediately_to_subdomain boolean,
    ep_httpwww_redirect_immediately_to_www boolean,
    ep_httpwww_server_header text,
    ep_httpwww_server_version text,
    ep_httpwww_status integer,
    ep_httpwww_unknown_error boolean,
    ep_httpwww_url text
);

--
-- Name: root_domains; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.root_domains (
    root_domain_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization_name text NOT NULL,
    root_domain text NOT NULL,
    ip_address text,
    data_source_uid uuid NOT NULL
);

--
-- Name: shodan_assets; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.shodan_assets (
    shodan_asset_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port integer,
    protocol text,
    "timestamp" timestamp without time zone,
    product text,
    server text,
    tags text[],
    domains text[],
    hostnames text[],
    isn text,
    asn integer,
    data_source_uid uuid NOT NULL
);

--
-- Name: shodan_insecure_protocols_unverified_vulns; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.shodan_insecure_protocols_unverified_vulns (
    insecure_product_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port integer,
    protocol text,
    type text,
    name text,
    potential_vulns text[],
    mitigation text,
    "timestamp" timestamp without time zone,
    product text,
    server text,
    tags text[],
    domains text[],
    hostnames text[],
    isn text,
    asn integer,
    data_source_uid uuid NOT NULL
);

--
-- Name: shodan_verified_vulns; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.shodan_verified_vulns (
    verified_vuln_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    organizations_uid uuid NOT NULL,
    organization text,
    ip text,
    port text,
    protocol text,
    "timestamp" timestamp without time zone,
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
    data_source_uid uuid NOT NULL
);

--
-- Name: sub_domains; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.sub_domains (
    sub_domain_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    sub_domain text NOT NULL,
    root_domain_uid uuid NOT NULL,
    root_domain text NOT NULL,
    data_source_uid uuid NOT NULL
);

--
-- Name: sub_domains_web_assets; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.sub_domains_web_assets (
    sub_domain_uid uuid NOT NULL,
    asset_uid uuid NOT NULL
);

--
-- Name: top_cves; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.top_cves (
    top_cves_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    cve_id text,
    dynamic_rating text,
    nvd_base_score text,
    date date,
    summary text,
    data_source_uid uuid NOT NULL
);

--
-- Name: unique_software; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.unique_software (
    _id uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    software_name text NOT NULL
);

--
-- Name: web_assets; Type: TABLE; Schema: public; Owner: pe
--

CREATE TABLE public.web_assets (
    asset_uid uuid DEFAULT public.uuid_generate_v1() NOT NULL,
    asset_type text NOT NULL,
    asset text NOT NULL,
    ip_type text,
    verified boolean,
    organizations_uid uuid NOT NULL,
    asset_origin text,
    report_on boolean DEFAULT true,
    last_scanned timestamp without time zone,
    report_status_reason text,
    data_source_uid uuid NOT NULL
);

ALTER TABLE public.web_assets OWNER TO pe;

--
-- Name: Users Users_api_key_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_api_key_key" UNIQUE (api_key);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (alerts_uid);


--
-- Name: alerts alerts_sixgill_id_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_sixgill_id_key UNIQUE (sixgill_id);


--
-- Name: alias alias_alias_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alias
    ADD CONSTRAINT alias_alias_key UNIQUE (alias);


--
-- Name: alias alias_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alias
    ADD CONSTRAINT alias_pkey PRIMARY KEY (alias_uid);


--
-- Name: asset_headers asset_headers_organizations_uid_sub_url_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.asset_headers
    ADD CONSTRAINT asset_headers_organizations_uid_sub_url_key UNIQUE (organizations_uid, sub_url);


--
-- Name: asset_headers asset_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.asset_headers
    ADD CONSTRAINT asset_headers_pkey PRIMARY KEY (_id);


--
-- Name: credential_exposures credential_exposure_unique_constraint; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_exposures
    ADD CONSTRAINT credential_exposure_unique_constraint UNIQUE (breach_name, email, name);


--
-- Name: cybersix_exposed_credentials cybersix_exposed_credentials_email_breach_id_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.cybersix_exposed_credentials
    ADD CONSTRAINT cybersix_exposed_credentials_email_breach_id_key UNIQUE (email, breach_id);


--
-- Name: cybersix_exposed_credentials cybersix_exposed_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.cybersix_exposed_credentials
    ADD CONSTRAINT cybersix_exposed_credentials_pkey PRIMARY KEY (csg_exposed_credentials_uid);


--
-- Name: cyhy_db_assets cyhy_db_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.cyhy_db_assets
    ADD CONSTRAINT cyhy_db_assets_pkey PRIMARY KEY (_id);


--
-- Name: data_source data_source_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.data_source
    ADD CONSTRAINT data_source_pkey PRIMARY KEY (data_source_uid);


--
-- Name: domain_alerts domain_alerts_alert_type_sub_domain_uid_date_new_value_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_alerts
    ADD CONSTRAINT domain_alerts_alert_type_sub_domain_uid_date_new_value_key UNIQUE (alert_type, sub_domain_uid, date, new_value);


--
-- Name: domain_alerts domain_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_alerts
    ADD CONSTRAINT domain_alerts_pkey PRIMARY KEY (domain_alert_uid);


--
-- Name: domain_permutations domain_permutations_domain_permutation_organizations_uid_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_permutations
    ADD CONSTRAINT domain_permutations_domain_permutation_organizations_uid_key UNIQUE (domain_permutation, organizations_uid);


--
-- Name: executives executives_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_pkey PRIMARY KEY (executives_uid);


--
-- Name: credential_breaches hibp_breaches_breach_name_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_breaches
    ADD CONSTRAINT hibp_breaches_breach_name_key UNIQUE (breach_name);


--
-- Name: credential_breaches hibp_breaches_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_breaches
    ADD CONSTRAINT hibp_breaches_pkey PRIMARY KEY (credential_breaches_uid);


--
-- Name: credential_exposures hibp_exposed_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_exposures
    ADD CONSTRAINT hibp_exposed_credentials_pkey PRIMARY KEY (credential_exposures_uid);


--
-- Name: mentions mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT mentions_pkey PRIMARY KEY (mentions_uid);


--
-- Name: mentions mentions_sixgill_mention_id_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT mentions_sixgill_mention_id_key UNIQUE (sixgill_mention_id);


--
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (organizations_uid);


--
-- Name: pshtt_results pshtt_results_organizations_uid_sub_domain_uid_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.pshtt_results
    ADD CONSTRAINT pshtt_results_organizations_uid_sub_domain_uid_key UNIQUE (organizations_uid, sub_domain_uid);


--
-- Name: pshtt_results pshtt_results_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.pshtt_results
    ADD CONSTRAINT pshtt_results_pkey PRIMARY KEY (pshtt_results_uid);


--
-- Name: root_domains root_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.root_domains
    ADD CONSTRAINT root_domains_pkey PRIMARY KEY (root_domain_uid);


--
-- Name: root_domains root_domains_root_domain_organizations_uid_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.root_domains
    ADD CONSTRAINT root_domains_root_domain_organizations_uid_key UNIQUE (root_domain, organizations_uid);


--
-- Name: shodan_assets shodan_assets_organizations_uid_ip_port_protocol_timestamp_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_assets
    ADD CONSTRAINT shodan_assets_organizations_uid_ip_port_protocol_timestamp_key UNIQUE (organizations_uid, ip, port, protocol, "timestamp");


--
-- Name: shodan_assets shodan_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_assets
    ADD CONSTRAINT shodan_assets_pkey PRIMARY KEY (shodan_asset_uid);


--
-- Name: shodan_insecure_protocols_unverified_vulns shodan_insecure_protocols_unv_organizations_uid_ip_port_pro_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_insecure_protocols_unverified_vulns
    ADD CONSTRAINT shodan_insecure_protocols_unv_organizations_uid_ip_port_pro_key UNIQUE (organizations_uid, ip, port, protocol, "timestamp");


--
-- Name: shodan_insecure_protocols_unverified_vulns shodan_insecure_protocols_unverified_vulns_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_insecure_protocols_unverified_vulns
    ADD CONSTRAINT shodan_insecure_protocols_unverified_vulns_pkey PRIMARY KEY (insecure_product_uid);


--
-- Name: shodan_verified_vulns shodan_verified_vulns_organizations_uid_ip_port_protocol_ti_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_verified_vulns
    ADD CONSTRAINT shodan_verified_vulns_organizations_uid_ip_port_protocol_ti_key UNIQUE (organizations_uid, ip, port, protocol, "timestamp");


--
-- Name: shodan_verified_vulns shodan_verified_vulns_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_verified_vulns
    ADD CONSTRAINT shodan_verified_vulns_pkey PRIMARY KEY (verified_vuln_uid);


--
-- Name: sub_domains sub_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains
    ADD CONSTRAINT sub_domains_pkey PRIMARY KEY (sub_domain_uid);


--
-- Name: sub_domains sub_domains_sub_domain_root_domain_uid_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains
    ADD CONSTRAINT sub_domains_sub_domain_root_domain_uid_key UNIQUE (sub_domain, root_domain_uid);


--
-- Name: sub_domains_web_assets sub_domains_web_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains_web_assets
    ADD CONSTRAINT sub_domains_web_assets_pkey PRIMARY KEY (sub_domain_uid, asset_uid);


--
-- Name: top_cves top_cves_cve_id_date_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.top_cves
    ADD CONSTRAINT top_cves_cve_id_date_key UNIQUE (cve_id, date);


--
-- Name: top_cves top_cves_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.top_cves
    ADD CONSTRAINT top_cves_pkey PRIMARY KEY (top_cves_uid);


--
-- Name: unique_software unique_software_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.unique_software
    ADD CONSTRAINT unique_software_pkey PRIMARY KEY (_id);


--
-- Name: web_assets web_assets_asset_organizations_uid_key; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.web_assets
    ADD CONSTRAINT web_assets_asset_organizations_uid_key UNIQUE (asset, organizations_uid);


--
-- Name: web_assets web_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.web_assets
    ADD CONSTRAINT web_assets_pkey PRIMARY KEY (asset_uid);


--
-- Name: ix_Users_email; Type: INDEX; Schema: public; Owner: pe
--

CREATE UNIQUE INDEX "ix_Users_email" ON public."Users" USING btree (email);


--
-- Name: ix_Users_username; Type: INDEX; Schema: public; Owner: pe
--

CREATE UNIQUE INDEX "ix_Users_username" ON public."Users" USING btree (username);


--
-- Name: alerts alerts_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: alerts alerts_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: alias alias_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.alias
    ADD CONSTRAINT alias_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: credential_breaches credential_breaches_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_breaches
    ADD CONSTRAINT credential_breaches_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: credential_exposures credential_exposures_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_exposures
    ADD CONSTRAINT credential_exposures_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: cybersix_exposed_credentials cybersix_exposed_credentials_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.cybersix_exposed_credentials
    ADD CONSTRAINT cybersix_exposed_credentials_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: domain_permutations dnstwist_domain_masq_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_permutations
    ADD CONSTRAINT dnstwist_domain_masq_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: domain_alerts domain_alerts_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_alerts
    ADD CONSTRAINT domain_alerts_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: domain_alerts domain_alerts_sub_domain_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_alerts
    ADD CONSTRAINT domain_alerts_sub_domain_uid_fkey FOREIGN KEY (sub_domain_uid) REFERENCES public.sub_domains(sub_domain_uid) NOT VALID;


--
-- Name: domain_permutations domain_permutations_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_permutations
    ADD CONSTRAINT domain_permutations_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: domain_permutations domain_permutations_sub_domain_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.domain_permutations
    ADD CONSTRAINT domain_permutations_sub_domain_uid_fkey FOREIGN KEY (sub_domain_uid) REFERENCES public.sub_domains(sub_domain_uid) NOT VALID;


--
-- Name: executives executives_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.executives
    ADD CONSTRAINT executives_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: credential_exposures hibp_exposed_credentials_breach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_exposures
    ADD CONSTRAINT hibp_exposed_credentials_breach_id_fkey FOREIGN KEY (credential_breaches_uid) REFERENCES public.credential_breaches(credential_breaches_uid) NOT VALID;


--
-- Name: credential_exposures hibp_exposed_credentials_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.credential_exposures
    ADD CONSTRAINT hibp_exposed_credentials_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: mentions mentions_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT mentions_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: pshtt_results pshtt_results_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.pshtt_results
    ADD CONSTRAINT pshtt_results_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: pshtt_results pshtt_results_sub_domain_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.pshtt_results
    ADD CONSTRAINT pshtt_results_sub_domain_uid_fkey FOREIGN KEY (sub_domain_uid) REFERENCES public.sub_domains(sub_domain_uid) NOT VALID;


--
-- Name: root_domains root_domains_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.root_domains
    ADD CONSTRAINT root_domains_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: root_domains root_domains_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.root_domains
    ADD CONSTRAINT root_domains_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: shodan_assets shodan_assets_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_assets
    ADD CONSTRAINT shodan_assets_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: shodan_assets shodan_assets_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_assets
    ADD CONSTRAINT shodan_assets_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: shodan_insecure_protocols_unverified_vulns shodan_insecure_protocols_unverified_vul_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_insecure_protocols_unverified_vulns
    ADD CONSTRAINT shodan_insecure_protocols_unverified_vul_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: shodan_insecure_protocols_unverified_vulns shodan_insecure_protocols_unverified_vulns_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_insecure_protocols_unverified_vulns
    ADD CONSTRAINT shodan_insecure_protocols_unverified_vulns_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: shodan_verified_vulns shodan_verified_vulns_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_verified_vulns
    ADD CONSTRAINT shodan_verified_vulns_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: shodan_verified_vulns shodan_verified_vulns_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.shodan_verified_vulns
    ADD CONSTRAINT shodan_verified_vulns_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: sub_domains sub_domains_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains
    ADD CONSTRAINT sub_domains_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: sub_domains sub_domains_root_domain_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains
    ADD CONSTRAINT sub_domains_root_domain_uid_fkey FOREIGN KEY (root_domain_uid) REFERENCES public.root_domains(root_domain_uid) NOT VALID;


--
-- Name: sub_domains_web_assets sub_domains_web_assets_asset_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains_web_assets
    ADD CONSTRAINT sub_domains_web_assets_asset_uid_fkey FOREIGN KEY (asset_uid) REFERENCES public.web_assets(asset_uid) NOT VALID;


--
-- Name: sub_domains_web_assets sub_domains_web_assets_sub_domain_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.sub_domains_web_assets
    ADD CONSTRAINT sub_domains_web_assets_sub_domain_uid_fkey FOREIGN KEY (sub_domain_uid) REFERENCES public.sub_domains(sub_domain_uid) NOT VALID;


--
-- Name: top_cves top_cves_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.top_cves
    ADD CONSTRAINT top_cves_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: web_assets web_assets_data_source_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.web_assets
    ADD CONSTRAINT web_assets_data_source_uid_fkey FOREIGN KEY (data_source_uid) REFERENCES public.data_source(data_source_uid) NOT VALID;


--
-- Name: web_assets web_assets_organizations_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pe
--

ALTER TABLE ONLY public.web_assets
    ADD CONSTRAINT web_assets_organizations_uid_fkey FOREIGN KEY (organizations_uid) REFERENCES public.organizations(organizations_uid) NOT VALID;


--
-- Name: new_vw_breach_complete; Type: VIEW; Schema: public; Owner: pe
--

CREATE VIEW public.new_vw_breach_complete AS
    SELECT creds.credential_exposures_uid,
    creds.email,
    creds.breach_name,
    creds.organizations_uid,
    creds.root_domain,
    creds.sub_domain,
    creds.hash_type,
    creds.name,
    creds.login_id,
    creds.password,
    creds.phone,
    creds.data_source_uid,
    b.description,
    b.breach_date,
    b.added_date,
    b.modified_date,
    b.data_classes,
    b.password_included,
    b.is_verified,
    b.is_fabricated,
    b.is_sensitive,
    b.is_retired,
    b.is_spam_list
    FROM (public.credential_exposures creds
        JOIN public.credential_breaches b ON ((creds.credential_breaches_uid = b.credential_breaches_uid)));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO crossfeed;


--
-- Fill table with DHS
--

INSERT INTO organizations (name, cyhy_db_name)
VALUES ('Department of Homeland Security', 'DHS');

INSERT INTO organizations (name, cyhy_db_name)
VALUES ('Department of State', 'DOS');

INSERT INTO data_source(name, description, last_run)
VALUES ('Shodan', 'IoT scanner', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('HaveIBeenPwned', 'Credentials', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('DNSTwist', 'Domain Permutations', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('DNSMonitor', 'Domain Permutations', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('CIRCL.lu', 'CVE engine', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('WhoisXML', 'DNS lookpus', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('findomain', 'Domain enumerator', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('Sublist3r', 'Domain Permutations', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('Cybersixgill', 'Dark web mentions and credentials', '2022-03-14');

INSERT INTO data_source(name, description, last_run)
VALUES ('unknown', 'Source unknown', '2022-03-14');

--
-- PostgreSQL database dump complete
--


`;

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
