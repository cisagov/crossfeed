import {
  Organization,
  Domain,
  Service,
  Vulnerability,
  connectToDatabase
} from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import got from 'got';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { Object } from 'aws-sdk/clients/appflow';
import { exit } from 'process';
import saveDomainsToDb from './helpers/saveDomainsToDb';
import { passportJwtSecret } from 'jwks-rsa';

async function getAuth() {
  const results: any[] = await got
    .post('https://delta.lookingglasscyber.com' + '/auth/login', {
      json: {
        params: {
          username: process.env.LG_USERNAME,
          password: process.env.LG_PASSWORD
        }
      },
      headers: {
        'Content-Type': 'application/json, application/transit+json',
        Accept: 'application/json, application/transit+json',
        'User-Agent': 'CISA-VulnerabilityManagement'
      }
    })
    .json();
  console.log(results);
  return results;
}

async function POST(resource, token, modifier) {
  const api = resource;
  const url = 'https://delta.lookingglasscyber.com' + api;
  const params = modifier;
  // let h1 = {'Content-Type': 'application/json, application/transit+json', 'Accept': 'application/json, application/transit+json', 'x-lg-session': token, 'User-Agent': 'CISA-VulnerabilityManagement'}
  const h1 = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + process.env.LG_API_KEY
  };
  const results: any[] = await got
    .post(url, {
      json: params,
      headers: h1
    })
    .json();
  console.log(results);
  return results;
}

async function getOrg(organizationId: string | undefined) {
  await connectToDatabase();
  if (typeof organizationId === 'string') {
    const organization = await Organization.findOne(organizationId);
    if (organization) {
      return organization;
    } else {
      console.log('No organization found');
      exit;
    }
  } else {
    console.log('No OrganizationId provided');
    exit;
  }
}

async function collectionByWorkspace(workspaceID, token) {
  const resource = '/api/collections/get-collections-by-workspace';
  const modifier = {
    params: {
      'workspace-id': workspaceID,
      attributes: ['collection-id', 'name', 'tic-score', 'assigned-to']
    }
  };
  const data = await POST(resource, token, modifier);
  return data;
}

async function getThreatInfo(token, collectionID) {
  const resource = '/api/graph/query';
  const modifier = {
    query: [
      'and',
      ['=', 'type', ['associated-with']],
      ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
      ['=', 'left.collectionIds', collectionID]
    ],
    fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
    limit: 100000,
    workspaceIds: []
  };
  const data = await POST(resource, token, modifier);
  return data;
}

async function saveAndPullDomains(response, organizationId, scanId, Org) {
  const domains: Domain[] = [];
  const data = response;
  for (const l of data['results']) {
    const current_Domain = plainToClass(Domain, {
      name: l['left']['name'],
      ip: l['left']['name'],
      organization: { id: organizationId },
      fromRootDomain: Org['rootDomains'][0],
      discoveredBy: { id: scanId }
    });
    domains.push(current_Domain);
  }
  await saveDomainsToDb(domains);

  await connectToDatabase();

  let pulledDomains = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('ip IS NOT NULL');

  if (organizationId) {
    pulledDomains = pulledDomains.andWhere('domain.organization=:org', {
      org: organizationId
    });
  }
  if (scanId) {
    pulledDomains = pulledDomains.andWhere('domain.discoveredBy=:scan', {
      scan: scanId
    });
  }

  return pulledDomains.getMany();
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  const Org = await getOrg(organizationId);
  console.log(Org);

  console.log('Running hibp on organization', organizationName);
  const domainsWithIPs = await getIps(organizationId);
  const results = await getAuth();
  console.log('Here are the Results');
  console.log(results);
  const sessionToken: string = results['result']['e_session-key_s'];

  const orgID = results['result']['e_org_z'];
  const workspaceID = results['result']['e_user-default-workspace_z'];
  const userID = results['result']['e_user_z'];
  const collections = await collectionByWorkspace(workspaceID, sessionToken);
  const ipsAndDomains: string[] = [];
  const domains: Domain[] = [];
  const Vulns_list: object[] = [];
  const Vulnerabilities: Vulnerability[] = [];
  console.log(collections);
  for (const line of collections['result']) {
    //Match the organization to the LookingGlass Collection
    if (organizationName == line['name']) {
      const collectionID = line['collection-id'];
      console.log(line['name']);
      //Query LookingGlass for the Threat info
      const data = await getThreatInfo(sessionToken, collectionID);
      const responseDomains: Domain[] = await saveAndPullDomains(
        data,
        organizationId,
        scanId,
        Org
      );
      for (const l of data['results']) {
        //Create a dictionary of relevant fields from the API request
        if (typeof Org === 'object') {
          const val = {
            firstSeen: new Date(l['firstSeen']),
            lastSeen: new Date(l['lastSeen']),
            sources: l['sources'],
            ref_type: l['ref']['type'],
            ref_right_type: l['ref']['right']['type'],
            ref_right_id: l['ref']['right']['id'],
            ref_left_type: l['ref']['left']['type'],
            ref_left_id: l['ref']['right']['id'],

            right_ticScore: l['right']['ticScore'],
            right_classifications: l['right']['classifications'],
            right_name: l['right']['name'],

            left_type: l['left']['type'],
            left_ticScore: l['left']['ticScore'],
            left_name: l['left']['name']
          };
          if (l['right']['classifications'][0] == 'Vulnerable Service') {
            val['vulnOrMal'] = 'Vulnerability';
          } else {
            val['vulnOrMal'] = 'Malware';
          }
          //if the Domain already exists and add this vuln to the associated vulnerability
          if (l['left']['name'] in ipsAndDomains) {
            for (const Vuln of Vulns_list) {
              if (Vuln['domain'].name == l['left']['name']) {
                Vuln['structuredData']['lookingGlassData'].push(val);
              }
            }
          }
          //if the Domain hasn't been used create a new Domain and a new Vulnerability
          else {
            for (const x of responseDomains) {
              if (x.name == l['left']['name']) {
                const current_Domain = x;

                const V = {
                  domain: current_Domain,
                  lastSeen: new Date(Date.now()),
                  title: 'Looking Glass Data',
                  state: 'open',
                  source: 'lookingGlass',
                  needsPopulation: false,
                  structuredData: {
                    lookingGlassData: [val]
                  },
                  description: `These are Vulnerabilities and Malware found by LookingGlass for ${organizationName}`
                };
                Vulns_list.push(V);
              }
            }
            ipsAndDomains.push(l['left']['name']);
          }
        }
      }

      for (const v of Vulns_list) {
        Vulnerabilities.push(plainToClass(Vulnerability, v));
      }
      await saveVulnerabilitiesToDb(Vulnerabilities, false);
    }
  }
};
