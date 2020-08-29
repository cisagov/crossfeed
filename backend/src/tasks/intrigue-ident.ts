import { Domain } from '../models';
import { CommandOptions } from './ecs-client';
import getLiveWebsites from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import * as buffer from 'buffer';
import { spawnSync } from 'child_process';

const intrigueIdent = async (domain: Domain): Promise<void> => {
  console.log('Domain', domain.name);
  for (const service of domain.services) {
    if (service.port !== 80 && service.port !== 443) {
      continue;
    }
    const url =
      service.port === 443 ? `https://${domain.name}` : `http://${domain.name}`;
    const { stdout, stderr, status } = spawnSync('intrigue-ident', [
      '--uri',
      url,
      '--json'
    ]);
    if (stderr.toString()) {
      console.error('stderr', stderr.toString());
    }
    if (status !== 0) {
      console.error('IntrigueIdent failed');
      continue;
    }
    const output = stdout.toString();
    const { fingerprint, content } = JSON.parse(
      output.substring(output.indexOf('{'))
    );
    service.intrigueIdentResults = { fingerprint, content };
    await service.save();
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running intrigueIdent on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const queue = new PQueue({ concurrency: 5 });
  await Promise.all(
    liveWebsites.map((site) => queue.add(() => intrigueIdent(site)))
  );

  console.log(`IntrigueIdent finished for ${liveWebsites.length} domains`);
};
