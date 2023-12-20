import axios, { AxiosError } from 'axios';
import { CommandOptions } from './ecs-client';
import { getLiveWebsites, LiveDomain } from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import { wappalyzer } from './helpers/simple-wappalyzer';
import logger from '../tools/lambda-logger';

const wappalyze = async (domain: LiveDomain): Promise<void> => {
  try {
    logger.info(`Executing wapplyzer on ${domain.url}`);

    const { data, status, headers } = await axios.get(domain.url, {
      timeout: 10000,
      validateStatus: () => true
    });

    // only response with HTTPStatusCode lesser than 5xx are "wappalyzed"
    if (status < 500) {
      const result = wappalyzer({ data, url: domain.url, headers });
      if (result.length > 0) {
        const filteredResults = result.filter((e) => e?.technology);

        // no need to save if there are no technologies results. Reducing database traffic.
        if (filteredResults.length > 0) {
          domain.service.wappalyzerResults = filteredResults;
          await domain.service.save();
          logger.info(
            `${domain.url} - ${filteredResults.length} technology matches saved.`
          );
        } else {
          logger.info(
            `${domain.url} - there were no technology matches for domain.`
          );
        }
      }
    } else {
      logger.info(
        `${domain.url} returned and HTTP error code. HTTPStatusCode: ${status}`
      );
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      const error = e as AxiosError;
      if (error.response) {
        // a response was received but we failed after the response
        logger.error(`${domain.url} returned error.
          Code: ${error.code}. 
          Response: ${error.response}`);
      } else if (error.code === 'ECONNABORTED') {
        // request timed out
        logger.error(
          `${domain.url} domain did not respond in a timely manner: ${error.message}`
        );
      } else {
        // other errors
        logger.error(
          `${domain.url} - Axios unexpected error. 
        Code (if any): ${error.code}. 
        Error: ${JSON.stringify(error, null, 4)}`
        );
      }
    } else {
      logger.error(
        `${domain.url} - Unknown unexpected error. 
        Type: ${e.typeof}. 
        Error: ${JSON.stringify(e, null, 4)}`
      );
    }
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  logger.info(`Running wappalyzer on organization ${organizationName}`);

  const liveWebsites = await getLiveWebsites(organizationId!);
  const queue = new PQueue({ concurrency: 5 });
  await Promise.all(
    liveWebsites.map((site) => queue.add(() => wappalyze(site)))
  );

  logger.info(
    `Wappalyzer finished for organization ${organizationName} on ${liveWebsites.length} domains`
  );
};
