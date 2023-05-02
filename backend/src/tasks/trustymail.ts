import getAllDomains from './helpers/getAllDomains';
import { spawnSync } from 'child_process';
import { CommandOptions } from './ecs-client';
import * as path from 'path';
import * as fs from 'fs';

// TODO: Scan results are concatenated to a single file per organization.
// The header is duplicated for each domain so we need to either remove duplicates or skip the header when reading the results.csv for each domain.
const csvHeader = `Domain,Base Domain,Live,MX Record,MX Record DNSSEC,Mail Servers,Mail Server Ports Tested,Domain Supports SMTP Results,Domain Supports SMTP,Domain Supports STARTTLS Results,Domain Supports STARTTLS,SPF Record,SPF Record DNSSEC,Valid SPF,SPF Results,DMARC Record,DMARC Record DNSSEC,Valid DMARC,DMARC Results,DMARC Record on Base Domain,DMARC Record on Base Domain DNSSEC,Valid DMARC Record on Base Domain,DMARC Results on Base Domain,DMARC Policy,DMARC Subdomain Policy,DMARC Policy Percentage,DMARC Aggregate Report URIs,DMARC Forensic Report URIs,DMARC Has Aggregate Report URI,DMARC Has Forensic Report URI,DMARC Reporting Address Acceptance Error,Syntax Errors,Debug Info
`;
export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;
  const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.csv');
  fs.writeFileSync(OUT_PATH, csvHeader);

  console.log('Running trustymail on organization', organizationName);

  const domains = await getAllDomains([organizationId!]);
  console.log(`${organizationName} domains`, domains);

  for (const domain of domains) {
    try {
      const args = [domain.name];
      console.log('Running trustymail with args', args);
      spawnSync('trustymail', args, { stdio: 'pipe' });
      fs.appendFileSync(OUT_PATH, String(fs.readFileSync('results.csv')));
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  console.log(
    `Trustymail scanned ${domains.length} domains for ${organizationName}`
  );
};
