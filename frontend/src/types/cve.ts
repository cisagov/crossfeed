export interface Cve {
  cve_uid: string;
  cve_name: string;
  published_date: string;
  last_modified_date: string;
  vuln_status: string;
  description: string;
  cvss_v2_source: string | null;
  cvss_v2_type: string | null;
  cvss_v2_version: string | null;
  cvss_v2_vector_string: string | null;
  cvss_v2_base_score: string | null;
  cvss_v2_base_severity: string | null;
  cvss_v2_exploitability_score: string | null;
  cvss_v2_impact_score: string | null;
  cvss_v3_source: string | null;
  cvss_v3_type: string | null;
  cvss_v3_version: string | null;
  cvss_v3_vector_string: string | null;
  cvss_v3_base_score: string | null;
  cvss_v3_base_severity: string | null;
  cvss_v3_exploitability_score: string | null;
  cvss_v3_impact_score: string | null;
  cvss_v4_source: string | null;
  cvss_v4_type: string | null;
  cvss_v4_version: string | null;
  cvss_v4_vector_string: string | null;
  cvss_v4_base_score: string | null;
  cvss_v4_base_severity: string | null;
  cvss_v4_exploitability_score: string | null;
  cvss_v4_impact_score: string | null;
  weaknesses: string;
  reference_urls: string;
  cpe_list: string;
}

