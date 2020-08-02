import { Domain, connectToDatabase } from '../models';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import getRootDomains from './helpers/getRootDomains';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import * as path from 'path';

const OUT_PATH = path.join(__dirname, 'out-' + Math.random() + '.txt');

/**
 * The CVE scan finds vulnerable CVEs affecting domains based on CPEs identified
 */

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running cve detection globally');

  await connectToDatabase();
  const allDomains = await Domain.find({
    select: ['id', 'name', 'ip', 'webTechnologies'],
    relations: ['services']
  });
  for (const domain of allDomains) {
    const cpes = new Set<string>();
    for (const tech of domain.webTechnologies) {
      if (tech.cpe && tech.version) cpes.add(tech.cpe + ':' + tech.version);
    }

    for (const service of domain.services) {
      if (
        service.censysMetadata &&
        service.censysMetadata.manufacturer &&
        service.censysMetadata.product &&
        service.censysMetadata.version
      ) {
        // TODO: Improve methods for getting CPEs from Censys
        // See https://www.napier.ac.uk/~/media/worktribe/output-1500093/identifying-vulnerabilities-using-internet-wide-scanning-data.pdf
        // and https://github.com/TheHairyJ/Scout
        cpes.add(
          `cpe:/a:${service.censysMetadata.manufacturer}:${service.censysMetadata.product}:${service.censysMetadata.version}`.toLowerCase()
        );
      }
    }
    console.log(cpes);
  }
};
