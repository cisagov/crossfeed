import { Domain, connectToDatabase, Vulnerability } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient from './es-client';

const MAX_RESULTS = 500;

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId } = commandOptions;

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
    .select(['domain.id'])
    .take(MAX_RESULTS);

  if (organizationId) {
    qs.where('organization.id=:org', { org: organizationId });
  }

  const domainIds = (await qs.getMany()).map((e) => e.id);

  if (domainIds.length) {
    const domains = await Domain.find({
      where: { id: In(domainIds) },
      relations: ['services', 'organization', 'vulnerabilities']
    });
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
