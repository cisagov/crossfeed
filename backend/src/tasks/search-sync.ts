import { Domain, connectToDatabase, Webpage } from '../models';
import { CommandOptions } from './ecs-client';
import { In } from 'typeorm';
import ESClient, { WebpageRecord } from './es-client';
import S3Client from './s3-client';
import PQueue from 'p-queue';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, domainId } = commandOptions;

  console.log('Running searchSync');
  await connectToDatabase();

  const client = new ESClient();

  // This filtering is used only for testing in search-sync.test.ts; usually,
  // this scan is called in a global fashion and runs on all organizations.
  const where: any = organizationId ? { organization: organizationId } : {};

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
      domain.organization?.updatedAt > syncedAt ||
      domain.services?.filter((e) => e.updatedAt > syncedAt).length ||
      domain.vulnerabilities?.filter((e) => e.updatedAt > syncedAt).length
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

  console.log('Retrieving webpages...');
  const qs = Webpage.createQueryBuilder('webpage')
    .where('webpage.updatedAt > webpage.syncedAt')
    .orWhere('webpage.syncedAt is null');

  // This filtering is also used only for testing in search-sync.test.ts.
  if (domainId) {
    qs.andWhere('webpage."domainId" = :id', { id: domainId });
  }

  // The response actually has keys "webpage_id", "webpage_createdAt", etc.
  const s3Client = new S3Client();
  const queue = new PQueue({ concurrency: 10 });
  const webpages: WebpageRecord[] = await qs.take(500).execute();
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
