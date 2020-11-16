import { plainToClass } from 'class-transformer';
import pRetry from 'p-retry';
import { connectToDatabase, Webpage } from '../../models';
import ESClient, { WebpageRecord } from '../es-client';
import { ScraperItem } from '../webscraper';

/** Saves scraped webpages to the database, and also syncs them
 * with Elasticsearch.
 */
export default async (scrapedWebpages: ScraperItem[]): Promise<void> => {
  await connectToDatabase();

  const urlToInsertedWebpage: { [x: string]: Webpage } = {};
  for (const scrapedWebpage of scrapedWebpages) {
    const result = await Webpage.createQueryBuilder()
      .insert()
      .values(
        plainToClass(Webpage, {
          lastSeen: new Date(Date.now()),
          syncedAt: new Date(Date.now()),
          domain: scrapedWebpage.domain,
          discoveredBy: scrapedWebpage.discoveredBy,
          url: scrapedWebpage.url,
          status: scrapedWebpage.status,
          responseSize: scrapedWebpage.response_size,
          headers: []
        })
      )
      .onConflict(
        `
        ("domainId","url") DO UPDATE
        SET "lastSeen" = excluded."lastSeen",
            "syncedAt" = excluded."syncedAt",
            "status" = excluded."status",
            "responseSize" = excluded."responseSize",
            "headers" = excluded."headers",
            "updatedAt" = now()
      `
      )
      .returning('*')
      .execute();
    urlToInsertedWebpage[scrapedWebpage.url] = result
      .generatedMaps[0] as Webpage;
  }
  console.log('Saving webpages to elasticsearch...');
  const client = new ESClient();
  await pRetry(
    () =>
      client.updateWebpages(
        scrapedWebpages
          .map((e) => {
            const insertedWebpage = urlToInsertedWebpage[e.url];
            if (!insertedWebpage) {
              console.log(`Inserted webpage not found for URL: ${e.url}`);
              return undefined;
            }
            return {
              webpage_id: insertedWebpage.id,
              webpage_createdAt: insertedWebpage.createdAt,
              webpage_updatedAt: insertedWebpage.updatedAt,
              webpage_syncedAt: insertedWebpage.syncedAt,
              webpage_lastSeen: insertedWebpage.lastSeen,
              webpage_url: insertedWebpage.url,
              webpage_status: insertedWebpage.status,
              webpage_domainId: e.domain!.id,
              webpage_discoveredById: e.discoveredBy!.id,
              webpage_responseSize: insertedWebpage.responseSize,
              webpage_headers: e.headers || [],
              webpage_body: e.body
            };
          })
          .filter((e) => e) as WebpageRecord[]
      ),
    {
      retries: 10,
      randomize: true
    }
  );
};
