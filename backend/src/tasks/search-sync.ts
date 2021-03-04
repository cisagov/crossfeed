import { Domain, connectToDatabase, Vulnerability, Webpage } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient from './es-client';
import { chunk } from 'lodash';
import pRetry from 'p-retry';

/**
 * Chunk sizes. These values are small during testing to facilitate testing.
 */
export const DOMAIN_CHUNK_SIZE = typeof jest === 'undefined' ? 50 : 10;

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, domainId } = commandOptions;

  console.log('Running searchSync');
  await connectToDatabase();

  const client = new ESClient();

  const qs = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .leftJoinAndSelect('domain.vulnerabilities', 'vulnerabilities')
    .leftJoinAndSelect('domain.services', 'services')
    .having('domain.syncedAt is null')
    .orHaving('domain.updatedAt > domain.syncedAt')
    .orHaving('organization.updatedAt > domain.syncedAt')
    .orHaving(
      'COUNT(CASE WHEN vulnerabilities.updatedAt > domain.syncedAt THEN 1 END) >= 1'
    )
    .orHaving(
      'COUNT(CASE WHEN services.updatedAt > domain.syncedAt THEN 1 END) >= 1'
    )
    .groupBy('domain.id, organization.id, vulnerabilities.id, services.id')
    .select(['domain.id']);

  if (organizationId) {
    // This parameter is used for testing only
    qs.where('organization.id=:org', { org: organizationId });
  }

  const domainIds = (await qs.getMany()).map((e) => e.id);
  console.log(`Got ${domainIds.length} domains.`);
  if (domainIds.length) {
    const domainIdChunks = chunk(domainIds, DOMAIN_CHUNK_SIZE);
    for (const domainIdChunk of domainIdChunks) {
      const domains = await Domain.find({
        where: { id: In(domainIdChunk) },
        relations: ['services', 'organization', 'vulnerabilities']
      });
      console.log(`Syncing ${domains.length} domains...`);
      await pRetry(() => client.updateDomains(domains), {
        retries: 3,
        randomize: true
      });

      await Domain.createQueryBuilder('domain')
        .update(Domain)
        .set({ syncedAt: new Date(Date.now()) })
        .where({ id: In(domains.map((e) => e.id)) })
        .execute();
    }
    console.log('Domain sync complete.');
  } else {
    console.log('Not syncing any domains.');
  }
};
