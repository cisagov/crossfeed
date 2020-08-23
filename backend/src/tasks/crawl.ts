import { Domain, connectToDatabase, Vulnerability } from '../models';
import { spawnSync, execSync } from 'child_process';
import { plainToClass } from 'class-transformer';
import { CommandOptions } from './ecs-client';
import * as buffer from 'buffer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import Apify, { CheerioHandlePageInputs, CheerioHandlePage } from "apify";
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://es:9200' });

process.env.APIFY_LOCAL_STORAGE_DIR = __dirname + "/apify-cache/" + Math.random();

export const handler = async (commandOptions: CommandOptions) => {

    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: 'https://www.cisa.gov/' });
    const dataset = await Apify.openDataset("pages");
    const handlePageFunction: CheerioHandlePage = async ({ request, body, $ }) => {
        console.log(request.url);
        const id = Math.random() + "";
        await dataset.pushData({
            id,
            timestamp: new Date(),
            url: request.url,
            body: body,
            text: Apify.utils.htmlToText($ as CheerioStatic)
        });
            // Add all links from page to ReqxwuestQueue
            await Apify.utils.enqueueLinks({
                $: $ as CheerioStatic,
                requestQueue,
                baseUrl: request.loadedUrl,
            });
    };
    // Create a CheerioCrawler
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl: 10,
    });
    // Run the crawler
    await crawler.run();


    await client.indices.create({
        index: 'pages',
        // body: {
        //   mappings: {
        //     properties: {
        //       id: { type: 'integer' },
        //       text: { type: 'text' },
        //       user: { type: 'keyword' },
        //       time: { type: 'date' }
        //     }
        //   }
        // }
      }, { ignore: [400] })

    const data = await dataset.getData();
    const body = data.items.map(doc => ({ index: { _index: 'pages' }, ...doc}) )

    const { body: bulkResponse } = await client.bulk({ refresh: true, body })
    console.error(bulkResponse);
    console.error();
};