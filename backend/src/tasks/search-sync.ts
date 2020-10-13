import { Domain, connectToDatabase, Vulnerability, Webpage } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient, { WebpageRecord } from './es-client';
import S3Client from './s3-client';
import PQueue from 'p-queue';
import { chunk } from 'lodash';

/**
 * Chunk sizes. These values are small during testing to facilitate testing.
 */
export const DOMAIN_CHUNK_SIZE = typeof jest === 'undefined' ? 100 : 10;
export const WEBPAGE_CHUNK_SIZE = typeof jest === 'undefined' ? 100 : 5;

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
      await client.updateDomains(domains);

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

  console.log('Retrieving webpages...');
  const qs_ = Webpage.createQueryBuilder('webpage').where(
    '(webpage.updatedAt > webpage.syncedAt OR webpage.syncedAt is null)'
  );

  if (domainId) {
    // This parameter is used for testing only
    qs_.andWhere('webpage."domainId" = :id', { id: domainId });
  }

  // The response actually has keys "webpage_id", "webpage_createdAt", etc.
  const s3Client = new S3Client();
  const webpages: WebpageRecord[] = await qs_.execute();
  console.log(`Got ${webpages.length} webpages.`);

  if (webpages.length) {
    const webpageChunks = chunk(webpages, WEBPAGE_CHUNK_SIZE);
    for (const webpageChunk of webpageChunks) {
      console.log(`Syncing ${webpageChunk.length} webpages...`);
      const queue = new PQueue({ concurrency: 10 });
      for (const i in webpageChunk) {
        const webpage = webpageChunk[i];
        if (webpage.webpage_s3Key) {
          queue.add(async () => {
            webpage.webpage_body = await s3Client.getWebpageBody(
              webpage.webpage_s3Key
            );
            if (Number(i) % 100 == 0) {
              console.log(`Finished getting contents from S3: ${i}`);
            }
          });
        }
      }
      await queue.onIdle();
      await client.updateWebpages(webpageChunk);

      await Webpage.createQueryBuilder('webpage')
        .update(Webpage)
        .set({ syncedAt: new Date(Date.now()) })
        .where({ id: In(webpageChunk.map((e) => e.webpage_id)) })
        .execute();
    }

    console.log('Webpage sync complete.');
  } else {
    console.log('Not syncing any webpages.');
  }
};
