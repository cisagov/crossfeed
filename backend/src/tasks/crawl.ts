import { Domain, connectToDatabase } from '../models';
import { CommandOptions } from './ecs-client';
import * as wappalyzer from 'simple-wappalyzer';
import Apify, { CheerioHandlePage } from 'apify';
import { Client } from '@elastic/elasticsearch';
import crypto from 'crypto';

const INDEX_NAME = 'webpages';

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanTaskId } = commandOptions;

  console.log('Running crawl on organization', organizationName);
  await connectToDatabase();
  const domains = await Domain.find({
    where: { organization: { id: organizationId } },
    select: ['id', 'name', 'ip']
  });

  const client = new Client({ node: 'http://localhost:9200' });

  process.env.APIFY_LOCAL_STORAGE_DIR =
    __dirname + '/apify-cache/' + Math.random();

  const requestQueue = await Apify.openRequestQueue();
  for (const domain of domains) {
    const userData = {
      domain
    };
    for (const url of [
      `http://${domain.name}`,
      `http://${domain.name}/robots.txt`,
      `http://${domain.name}/sitemap.xml`
    ]) {
      await requestQueue.addRequest({ url: `${url}`, userData });
    }
  }
  const dataset = await Apify.openDataset('pages');
  const handlePageFunction: CheerioHandlePage = async ({
    request,
    response,
    body,
    $
  }) => {
    console.log(request.url);
    const webTechnologies = await wappalyzer({
      url: response.url,
      data: body,
      statusCode: response.statusCode,
      headers: response.headers
    });
    const item = {
      domainName: request.userData.domain.name,
      domainId: request.userData.domain.id,
      organizationId: organizationId,
      organizationName: organizationName,
      scanTaskId: scanTaskId,
      timestamp: new Date(),
      url: request.url,
      body: body,
      text: Apify.utils.htmlToText($ as CheerioStatic),
      webTechnologies,
      statusCode: response.statusCode
    };
    await dataset.pushData(item);
    // Add all links from page to ReqxwuestQueue
    await Apify.utils.enqueueLinks({
      $: $ as CheerioStatic,
      requestQueue,
      baseUrl: request.loadedUrl,
      transformRequestFunction: (e) => ({
        ...e,
        userData: request.userData
      }),
      pseudoUrls: [`http[s?]://${request.userData.domain.name}/[.+]`]
    });
  };
  // Create a CheerioCrawler
  const crawler = new Apify.CheerioCrawler({
    requestQueue,
    handlePageFunction,
    maxRequestsPerCrawl: 1000,
    maxConcurrency: 10
  });
  // Run the crawler
  await crawler.run();

  const data = await dataset.getData();
  console.error(data.items.map((e) => (e as any).url));
  // const body = data.items.map(doc => ({ index: { _index: 'pages' }, ...doc}) )

  // const { body: bulkResponse } = await client.bulk({ refresh: true, body })
  // console.error(bulkResponse);

  await client.helpers.bulk({
    datasource: data.items,
    onDocument(doc: any) {
      return [
        {
          update: {
            _index: INDEX_NAME,
            _id: crypto
              .createHash('sha1')
              .update(doc.url)
              .update(doc.domainId)
              .update(doc.organizationId)
              .digest('base64')
          }
        },
        { doc_as_upsert: true }
      ];
    }
  });
  /**
backend_1   | {
backend_1   |   took: 34,
backend_1   |   errors: false,
backend_1   |   items: [
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] },
backend_1   |     { index: [Object] }
backend_1   |   ]
backend_1   | }
     */
};
