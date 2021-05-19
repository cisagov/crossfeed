import {
  Organization,
  Domain,
  Vulnerability,
  connectToDatabase
} from '../models';
import { CommandOptions } from './ecs-client';
import got from 'got';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { exit } from 'process';
import saveDomainsToDb from './helpers/saveDomainsToDb';

interface LGCollectionsResponse {
  children: any[];
  createdAt: string;
  createdBy: string;
  id: string;
  name: string;
  ticScore: number;
  updatedAt: string;
  updatedBy: string;
}

interface LGThreatResponse {
  totalHits: number;
  results: {
    firstSeen: number;
    lastSeen: number;
    sources: string[];
    right: {
      ticClassificationScores: number[];
      threatId: string;
      classifications: string[];
      ticScore: number;
      ticCriticality: number;
      ticSourceScore: number;
      ticObsInfluence: number;
      ref: {
        type: string;
        id: string;
      };
      threatCategories: string[];
      name: string;
      type: string;
      threatName: string;
    };
    left: {
      collectionIds: string[];
      classifications: string[];
      ticScore: number;
      owners: string[];
      ref: {
        type: string;
        id: number;
      };
      name: string;
      type: string;
      threatNames: string[];
      locations: {
        city: string;
        country: string;
        region: string;
        geoPoint: {
          long: number;
          lat: number;
        };
        countryName: string;
        sources: string[];
        country2Digit: string;
        lastSeen: number;
      }[];
      ipv4: number;
      asns: number[];
      threatIds: string[];
      cidrv4s: string[];
    };
    ref: {
      type: string;
      right: {
        type: string;
        id: string;
      };
      left: {
        type: string;
        id: string;
      };
    };
  }[];
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

async function collectionByWorkspace() {
  const resource =
    'https://delta.lookingglasscyber.com/api/v1/workspaces/' +
    'NCATS POV' +
    '/collections';

  return (await got(resource, {
    headers: { Authorization: 'Bearer ' + process.env.LG_API_KEY }
  }).json()) as LGCollectionsResponse[];
}

function ValidateIPaddress(ipaddress) {
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipaddress
    )
  ) {
    return true;
  }
  return false;
}

async function getThreatInfo(collectionID) {
  const resource = 'https://delta.lookingglasscyber.com/api/graph/query';
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
  const h1 = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + process.env.LG_API_KEY
  };
  return (got
    .post(resource, {
      json: modifier,
      headers: h1
    })
    .json() as unknown) as LGThreatResponse[];
}

async function saveAndPullDomains(response, organizationId, scanId, Org) {
  const domains: Domain[] = [];
  const data = response;
  for (const l of data['results']) {
    if (ValidateIPaddress(l['left']['name'])) {
      const current_Domain = plainToClass(Domain, {
        name: l['left']['name'],
        ip: l['left']['name'],
        organization: { id: organizationId },
        fromRootDomain: Org['rootDomains'][0],
        ipOnly: true,
        discoveredBy: { id: scanId }
      });
      domains.push(current_Domain);
    } else {
      const current_Domain = plainToClass(Domain, {
        name: l['left']['name'],
        ip: l['left']['name'],
        organization: { id: organizationId },
        fromRootDomain: Org['rootDomains'][0],
        ipOnly: false,
        discoveredBy: { id: scanId }
      });
      domains.push(current_Domain);
    }
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
  const D = await pulledDomains.getMany();
  return D;
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  const Org = await getOrg(organizationId);

  console.log('Running lookingGlass on organization', organizationName);

  const collections: LGCollectionsResponse[] = await collectionByWorkspace();
  const ipsAndDomains: string[] = [];
  const domains: Domain[] = [];
  const Vulns_list: any = [];
  const Vulnerabilities: Vulnerability[] = [];

  for (const line of collections) {
    //Match the organization to the LookingGlass Collection
    if (organizationName == line['name']) {
      const collectionID = line['id'];
      console.log(line['name']);
      //Query LookingGlass for the Threat info
      const data: LGThreatResponse[] = await getThreatInfo(collectionID);
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
          if (ipsAndDomains.includes(l['left']['name'])) {
            for (const Vuln of Vulns_list) {
              if (l['left']['name'] == Vuln['domain'].name) {
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
      console.log('Vulnerabilities Saved to Db');
    }
  }
};
