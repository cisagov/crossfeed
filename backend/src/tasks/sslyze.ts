import { CommandOptions } from './ecs-client';
import { getLiveWebsites, LiveDomain } from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import { execSync } from 'child_process';

const sslyze = async (domain: LiveDomain): Promise<void> => {
  try {
    const path = `/tmp/${domain.name}.crt`;
    const res = execSync(
      `echo "" | openssl s_client -connect ${domain.name}:443 > ${path}; openssl x509 -in ${path} -noout -enddate`,
      {
        shell: '/bin/bash'
      }
    );
    const output = String(res);
    const result = output.match(/notAfter=(.*)/);
    if (!result || !result[1]) {
      console.error('No notAfter date found, output is', output);
      return;
    }
    domain.ssl = {
      ...(domain.ssl || {}),
      validTo: new Date(result![1]).toISOString()
    };
    await domain.save();
  } catch (e) {
    console.error(domain.name, e);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running sslyze on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!, [], true);
  const queue = new PQueue({ concurrency: 5 });
  await Promise.all(liveWebsites.map((site) => queue.add(() => sslyze(site))));

  console.log(`sslyze finished for ${liveWebsites.length} domains`);
};
