import { Domain, connectToDatabase } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient from './es-client';

const MAX_RESULTS = 1000;

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId } = commandOptions;

  console.log('Running searchSync');
  await connectToDatabase();

  const client = new ESClient();

  const where = organizationId ? { organization: organizationId } : {};
  let domains = await Domain.find({
    where,
    relations: ['services', 'organization', 'vulnerabilities']
  });

  domains = domains.filter((domain) => {
    if (!domain.syncedAt) {
      // Domain hasn't been synced before
      return true;
    }
    const { syncedAt } = domain;
    if (
      domain.updatedAt > syncedAt ||
      domain.organization.updatedAt > syncedAt ||
      domain.services.filter((e) => e.updatedAt > syncedAt).length ||
      domain.vulnerabilities.filter((e) => e.updatedAt > syncedAt).length
    ) {
      // Some part of domains / services / vulnerabilities has been updated since the last sync,
      // so we need to sync this domain again.
      return true;
    }
    return false;
  });

  if (domains.length) {
    console.log(`Syncing ${domains.length} domains...`);
    await client.updateDomains(domains);

    await Domain.createQueryBuilder('domain')
      .update(Domain)
      .set({ syncedAt: new Date(Date.now()) })
      .where({ id: In(domains.map((e) => e.id)) })
      .execute();
    console.log('Domain sync complete.');
  } else {
    console.log('Not syncing any domains.');
  }
};
