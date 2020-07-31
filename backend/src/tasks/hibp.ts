import { Domain, Service } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import got from 'got';

/**
 * The hibp scan looks up emails from a particular domain
 * that have shown up in breaches using the Have I
 * Been Pwned Enterprise API.
 */

async function lookupEmails(breachesDict: any, domain: Domain) {
  const results: any[] = await got(
    'https://haveibeenpwned.com/api/v2/enterprisesubscriber/domainsearch/' +
      domain.name,
    {
      headers: {
        Authorization: 'Basic ' + process.env.HIBP_TOKEN!
      }
    }
  ).json();

  const finalResults = {};

  const shouldCountBreach = (breach) =>
    breach.DataClasses.indexOf('Passwords') > -1 &&
    breach.IsVerified === true &&
    breach.BreachDate > '2016-01-01';

  for (const email in results) {
    const filtered = (results[email] || []).filter((e) =>
      shouldCountBreach(breachesDict[e])
    );
    if (filtered.length > 0) {
      finalResults[email] = filtered;
    }
  }

  return finalResults;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running hibp on organization', organizationName);

  const domainsWithIPs = await getIps(organizationId);

  const breaches: any[] = await got(
    'https://haveibeenpwned.com/api/v2/breaches',
    {
      headers: {
        Authorization: 'Basic ' + process.env.HIBP_TOKEN!
      }
    }
  ).json();

  let breachesDict = {};
  for (let breach of breaches) {
    breachesDict[breach.Name] = breach;
  }

  const services: Service[] = [];
  for (const domain of domainsWithIPs) {
    const results = await lookupEmails(breachesDict, domain);
    console.log(
      `Got ${Object.keys(results).length} emails for domain ${domain.name}`
    );
    // TODO: save results to db.
  }
};
