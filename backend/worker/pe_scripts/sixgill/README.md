# Quick ReadMe for PE!!!

1. app/config/config.ini = put your sixgill credentials here....
2. (no need to touch) app/pe_source/sixgill/api.py = native sixgill api in python requests
3. (no need to touch) app/pe_source/sixgill/config.py = loads your bearer token
4. app/pe_source/sixgill/source.py = runs scripts to load postgres
   1. list_orgnizations() = get orgs from sixgill
   2. alias_organization() = gets an organizations aliases
   3. mentions() = gets data for mentions table for an organization.
   4. alerts() -  gets data for alerts table for an organization
   5. top_cves - pending permision form Sixgill, gets top 10 CVEs discussed on web.

