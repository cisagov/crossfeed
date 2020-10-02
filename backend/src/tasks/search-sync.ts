import { Domain, connectToDatabase, Vulnerability, Webpage } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient, { WebpageRecord }  from './es-client';
import S3Client from './s3-client';
import PQueue from 'p-queue';

const MAX_RESULTS = 500;

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

  console.log('Retrieving webpages...');
  const qs_ = Webpage.createQueryBuilder('webpage')
    .where('webpage.updatedAt > webpage.syncedAt')
    .orWhere('webpage.syncedAt is null');

  if (domainId) {
    qs_.andWhere('webpage."domainId" = :id', { id: domainId });
  }

  // The response actually has keys "webpage_id", "webpage_createdAt", etc.
  const s3Client = new S3Client();
  const queue = new PQueue({ concurrency: 10 });
  const webpages: WebpageRecord[] = await qs_.take(MAX_RESULTS).execute();
  console.log(`Got ${webpages.length} webpages. Retrieving body of each webpage...`);
  for (const i in webpages) {
    const webpage = webpages[i];
    if (webpage.webpage_s3Key) {
      queue.add(async () => {
        webpage.webpage_body = await s3Client.getWebpageBody(webpage.webpage_s3Key);
        if (Number(i) % 100 == 0) {
          console.log(`Finished: ${i}`);
        }
      });
    }
  }
  await queue.onIdle();

  if (webpages.length) {
    console.log(`Syncing ${webpages.length} webpages...`);
    const results = await client.updateWebpages(webpages);
    console.warn(results);

    await Webpage.createQueryBuilder('webpage')
      .update(Webpage)
      .set({ syncedAt: new Date(Date.now()) })
      .where({ id: In(webpages.map((e) => e.webpage_id)) })
      .execute();
    console.log('Webpage sync complete.');
  } else {
    console.log('Not syncing any webpages.');
  }
};
