import { Domain, Vulnerability } from '../models';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import { spawnSync } from 'child_process';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { plainToClass } from 'class-transformer';

interface NucleiResult {
  template: string;
  type: string;
  matched: string;
  severity: string;
  author: string;
  description: string;
}

/** Maps Nuclei severity to severity stored in the Vulnerabilities database.
 * See all severities at https://github.com/projectdiscovery/nuclei/blob/bc320d76fb5c19e9c958204cc0d72365b87106a4/internal/runner/templates.go#L19-L25.
 * TODO: it might be better to instead get this information from the NVD database.
 */
const SEVERITY_MAP = {
  info: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

const nuclei = async (domain: Domain): Promise<void> => {
  console.log('Domain', domain.name);
  for (const service of domain.services) {
    if (service.port !== 80 && service.port !== 443) {
      continue;
    }
    const url =
      service.port === 443 ? `https://${domain.name}` : `http://${domain.name}`;
    // TODO: consider running templates under nuclei-templates/vulnerabilities as well (those templates aren't
    // directly tied to CVEs, though).
    const { stdout, stderr, status } = spawnSync('nuclei', [
      '-target',
      url,
      '-t',
      'nuclei-templates/cves',
      '-json',
      '-silent',
      '-proxy-url',
      process.env.GLOBAL_AGENT_HTTP_PROXY!
    ]);
    if (stderr.toString()) {
      console.error('stderr', stderr.toString());
    }
    if (status !== 0) {
      console.error('Nuclei failed');
      continue;
    }
    const output = stdout.toString();
    const results: NucleiResult[] = output
      .split('\n')
      .filter((e) => e)
      .map((e) => JSON.parse(e));
    service.nucleiResults = results;
    await service.save();
    const vulnerabilities = results
      .filter((e) => e.template.startsWith('CVE-'))
      .map((e) =>
        plainToClass(Vulnerability, {
          domain: domain,
          lastSeen: new Date(Date.now()),
          title: e.template,
          cve: e.template,
          severity: SEVERITY_MAP[e.severity],
          state: 'open',
          substate: 'exploitable'
        })
      );
    await saveVulnerabilitiesToDb(vulnerabilities, false);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running nuclei on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const queue = new PQueue({ concurrency: 2 });
  await Promise.all(liveWebsites.map((site) => queue.add(() => nuclei(site))));

  console.log(`Nuclei finished for ${liveWebsites.length} domains`);
};
