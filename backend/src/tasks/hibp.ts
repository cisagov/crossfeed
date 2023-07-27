import { Domain, Service, Vulnerability, connectToDatabase } from '../models';
import { CommandOptions } from './ecs-client';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import axios from 'axios';

/**
 * The hibp scan looks up emails from a particular .gov domain
 * that have shown up in breaches using the Have I
 * Been Pwned Enterprise API.
 * Be aware this scan can only query breaches from .gov domains
 */

interface breachResults {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  passwordIncluded: boolean;
}

async function getIps(organizationId?: String): Promise<Domain[]> {
  await connectToDatabase();

  let domains = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('ip IS NOT NULL')
    .andWhere('domain.name LIKE :gov', { gov: '%.gov' })
    .andWhere('domain.ipOnly=:bool', { bool: false });

  if (organizationId) {
    domains = domains.andWhere('domain.organization=:org', {
      org: organizationId
    });
  }

  return domains.getMany();
}

async function lookupEmails(
  breachesDict: { [key: string]: breachResults },
  domain: Domain
) {
  try {
    const { data } = await axios.get(
      'https://haveibeenpwned.com/api/v2/enterprisesubscriber/domainsearch/' +
        domain.name,
      {
        headers: {
          Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
        }
      }
    );

    const addressResults = {};
    const breachResults = {};
    const finalResults = {};

    const shouldCountBreach = (breach) =>
      breach.IsVerified === true && breach.BreachDate > '2016-01-01';

    for (const email in data) {
      const filtered = (data[email] || []).filter((e) =>
        shouldCountBreach(breachesDict[e])
      );
      if (filtered.length > 0) {
        addressResults[email + '@' + domain.name] = filtered;
        for (const breach of filtered) {
          if (!(breach in breachResults)) {
            breachResults[breach] = breachesDict[breach];
            breachResults[breach].passwordIncluded =
              breachResults[breach].DataClasses.indexOf('Passwords') > -1;
          }
        }
      }
    }

    finalResults['Emails'] = addressResults;
    finalResults['Breaches'] = breachResults;
    return finalResults;
  } catch (error) {
    console.error(
      `An error occured when trying to access the HIPB API using the domain: ${domain.name}: ${error} `
    );
    return null;
  }
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running hibp on organization', organizationName);
  const domainsWithIPs = await getIps(organizationId);
  const { data } = await axios.get(
    'https://haveibeenpwned.com/api/v2/breaches',
    {
      headers: {
        Authorization: 'Bearer ' + process.env.HIBP_API_KEY!
      }
    }
  );
  const breachesDict: { [key: string]: breachResults } = {};
  for (const breach of data) {
    breachesDict[breach.Name] = breach;
  }

  const services: Service[] = [];
  const vulns: Vulnerability[] = [];
  for (const domain of domainsWithIPs) {
    const results = await lookupEmails(breachesDict, domain);

    if (results) {
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
            severity: 'Low',
            needsPopulation: false,
            structuredData: {
              emails: results['Emails'],
              breaches: results['Breaches']
            },
            description: `Emails associated with ${domain.name} have been exposed in a breach.`
          })
        );
        await saveVulnerabilitiesToDb(vulns, false);
      }
    }
  }
};
