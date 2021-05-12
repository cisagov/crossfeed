import { Domain, Service, Vulnerability } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import got from 'got';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';

/**
 * The hibp scan looks up emails from a particular domain
 * that have shown up in breaches using the Have I
 * Been Pwned Enterprise API.
 */

async function lookupEmails(breachesDict: any, domain: Domain) {
  try {
    const results: any[] = await got(
      'https://haveibeenpwned.com/api/v2/enterprisesubscriber/domainsearch/' +
        domain.name,
      {
        headers: {
          Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
        }
      }
    ).json();
  
    const AddressResults = {};
    const BreachResults = {};
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
        AddressResults[email + '@' + domain.name] = filtered;
        for (const breach of filtered) {
          if (!(breach in BreachResults)) {
            BreachResults[breach] = breachesDict[breach];
          }
        }
      }
    }
    finalResults['Emails'] = AddressResults;
    finalResults['Breaches'] = BreachResults;
    return finalResults;
  } catch (error) {
    console.error(`Domain ${domain.name} failed to run due to the following error:`);
    console.log(error['HTTPError'])
    return 0
  }
  
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running hibp on organization', organizationName);
  console.log("Before getIps")
  const domainsWithIPs = await getIps(organizationId);
  console.log("After getIps / before breaches api call")
  const breaches: any[] = await got(
    'https://haveibeenpwned.com/api/v2/breaches',
    {
      headers: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    }
  ).json();
  console.log("After API call")
  const breachesDict = {};
  for (const breach of breaches) {
    breachesDict[breach.Name] = breach;
  }

  const services: Service[] = [];
  const vulns: Vulnerability[] = [];
  for (const domain of domainsWithIPs) {
    console.log(domain.name)
    const results = await lookupEmails(breachesDict, domain);
    if(results){
      
      console.log(
      `Got ${Object.keys(results['Emails']).length} emails for domain ${
        domain.name
      }`
      );
    
      if (Object.keys(results['Emails']).length !== 0) {
        vulns.push(
          plainToClass(Vulnerability, {
            domain: domain,
            lastSeen: new Date(Date.now()),
            title: 'Exposed Emails',
            state: 'open',
            source: 'hibp',
            needsPopulation: false,
            structuredData: {
              emails: results['Emails'],
              breaches: results['Breaches']
            },
            description: `Emails associated with ${domain.name} have been exposed in a breach.`
          })
        );
        await saveVulnerabilitiesToDb(vulns, false);
        console.log(results['Emails']);
        console.log(results['Breaches']);
      }}
    
  }
};
