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

async function getCollectionForCurrentWorkspace() {
  const resource =
    'https://delta.lookingglasscyber.com/api/v1/workspaces/' +
    process.env.LG_WORKSPACE_NAME +
    '/collections';
  return (await got(resource, {
    headers: { Authorization: 'Bearer ' + process.env.LG_API_KEY }
  }).json()) as LGCollectionsResponse[];
}

function validateIPAddress(ipAddress) {
  return /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(ipAddress);
}

async function getThreatInfo(collectionID) {
  const resource = 'https://delta.lookingglasscyber.com/api/graph/query';
  const modifier = {
    period: 'all',
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

  return (got
    .post(resource, {
      json: modifier,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
    .json() as unknown) as LGThreatResponse[];
}

async function saveAndPullDomains(response, organizationId, scanId) {
  const domains: Domain[] = [];
  const data = response;
  for (const l of data.results) {
    if (validateIPAddress(l.left.name)) {
      const currentDomain = plainToClass(Domain, {
        name: l.left.name,
        ip: l.left.name,
        organization: { id: organizationId },
        fromRootDomain: '',
        ipOnly: true,
        discoveredBy: { id: scanId }
      });
      domains.push(currentDomain);
    } else {
      const currentDomain = plainToClass(Domain, {
        name: l.left.name,
        ip: l.left.name,
        organization: { id: organizationId },
        fromRootDomain: '',
        ipOnly: false,
        discoveredBy: { id: scanId }
      });
      domains.push(currentDomain);
    }
  }
  await saveDomainsToDb(domains);

  await connectToDatabase();

  let pulledDomains = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('ip IS NOT NULL');

  pulledDomains = pulledDomains.andWhere('domain.organization=:org', {
    org: organizationId
  });

  return pulledDomains.getMany();
}

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName, scanId } = commandOptions;

  console.log('Running lookingGlass on organization', organizationName);

  const collections: LGCollectionsResponse[] = await getCollectionForCurrentWorkspace();
  const ipsAndDomains: string[] = [];
  const vulnerabilities: Vulnerability[] = [];

  for (const line of collections) {
    // Match the organization to the LookingGlass Collection
    if (organizationName === line.name) {
      const collectionID = line.id;
      console.log(line.name);
      // Query LookingGlass for the Threat info
      const data: LGThreatResponse[] = await getThreatInfo(collectionID);
      const responseDomains: Domain[] = await saveAndPullDomains(
        data,
        organizationId,
        scanId
      );
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      console.log(d);
      for (const l of data['results']) {
        // Create a dictionary of relevant fields from the API request
        const lastSeen = new Date(l.firstSeen);
        if (lastSeen > d) {
          const val = {
            firstSeen: new Date(l.firstSeen),
            lastSeen: lastSeen,
            sources: l.sources,
            ref_type: l.ref.type,
            ref_right_type: l.ref.right.type,
            ref_right_id: l.ref.right.id,
            ref_left_type: l.ref.left.type,
            ref_left_id: l.ref.left.id,

            right_ticScore: l.right.ticScore,
            right_classifications: l.right.classifications,
            right_name: l.right.name,

            left_type: l.left.type,
            left_ticScore: l.left.ticScore,
            left_name: l.left.name
          };
          if (l.right.classifications[0] === 'Vulnerable Service') {
            val['vulnOrMal'] = 'Vulnerability';
          } else {
            val['vulnOrMal'] = 'Malware';
          }

          // If we've already seen this domain, add this vuln to the associated
          if (ipsAndDomains.includes(l.left.name)) {
            for (const Vuln of vulnerabilities) {
              if (l.left.name === Vuln.domain.name) {
                let matches = false;
                // If the Vuln type already exists for this Domain keep the most recent instance
                Vuln.structuredData['lookingGlassData'].forEach(function (
                  row,
                  index,
                  array
                ) {
                  if (l.right.name === row.right_name) {
                    if (lastSeen > row.lastSeen) {
                      val.firstSeen = row.firstSeen;
                      array[index] = val;
                    } else {
                      row.firstSeen = val.firstSeen;
                    }
                    matches = true;
                  }
                });
                if (!matches) {
                  Vuln.structuredData['lookingGlassData'].push(val);
                }
              }
            }
          }
          // If we haven't seen this domain yet, create a new Domain and a new Vulnerability
          else {
            for (const domain of responseDomains) {
              if (domain.name === l.left.name) {
                const currentDomain = domain;
                const vulnerability = {
                  domain: currentDomain,
                  lastSeen: new Date(Date.now()),
                  title: 'Looking Glass Data',
                  state: 'open',
                  source: 'lookingGlass',
                  needsPopulation: false,
                  structuredData: {
                    lookingGlassData: [val]
                  },
                  description: `Vulnerabilities and malware found by LookingGlass.`
                };
                vulnerabilities.push(
                  plainToClass(Vulnerability, vulnerability)
                );
              }
            }
            ipsAndDomains.push(l.left.name);
          }
        }
      }

      await saveVulnerabilitiesToDb(vulnerabilities, false);
      console.log('Vulnerabilities Saved to Db');
    }
  }
};
