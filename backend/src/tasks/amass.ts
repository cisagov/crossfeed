import { Domain } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as path from 'path';
import logger from '../tools/lambda-logger';

const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.txt');

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  logger.info(`Running amass on organization ${organizationName}`);

  const rootDomains = await getRootDomains(organizationId!);

  for (const rootDomain of rootDomains) {
    try {
      const args = [
        'enum',
        '-ip',
        '-active',
        '-d',
        rootDomain,
        '-json',
        OUT_PATH
      ];
      logger.info(`Running amass with args ${JSON.stringify(args)}`);
      spawnSync('amass', args, { stdio: 'pipe' });
      const output = String(readFileSync(OUT_PATH));
      const lines = output.split('\n');
      const domains: Domain[] = [];
      for (const line of lines) {
        if (line == '') continue;
        const parsed = JSON.parse(line);
        domains.push(
          plainToClass(Domain, {
            ip: parsed.addresses[0].ip,
            name: parsed.name,
            asn: parsed.addresses[0].asn,
            organization: { id: organizationId },
            fromRootDomain: rootDomain,
            subdomainSource: 'amass',
            discoveredBy: { id: scanId }
          })
        );
      }
      await saveDomainsToDb(domains);
      logger.info(`amass created/updated ${domains.length} new domains`);
    } catch (e) {
      logger.error(JSON.stringify(e));
      continue;
    }
  }
};
