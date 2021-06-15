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

interface ParsedLGResponse {
  firstSeen: Date;
  lastSeen: Date;
  sources: string[];
  ref_type: string;
  ref_right_type: string;
  ref_right_id: string;
  ref_left_type: string;
  ref_left_id: string;

  right_ticScore: number;
  right_classifications: string[];
  right_name: string;

  left_type: string;
  left_ticScore: number;
  left_name: string;
  vulnOrMal: string;
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

/**
 * Gets threat information from the LookingGlass API
 * for the collection with the given ID.
 */
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
    .json() as unknown) as LGThreatResponse;
}
/**
 * Save domains from LookingGlass API response, and retrieve
 * domains for the given organization.
 */
async function saveAndPullDomains(
  response: LGThreatResponse,
  organizationId: string,
  scanId: string
) {
  const domains: Domain[] = [];
  for (const l of response.results) {
    if (validateIPAddress(l.left.name)) {
      // If l.left.name is an IP address, the domain has no associated
      // domain name, so mark it as an ip-only domain.
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
        ip: '',
        organization: { id: organizationId },
        fromRootDomain: '',
        ipOnly: false,
        discoveredBy: { id: scanId }
      });
      domains.push(currentDomain);
    }
  }
  await saveDomainsToDb(domains);

  const pulledDomains = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('ip IS NOT NULL')
    .andWhere('domain.organization=:org', { org: organizationId });

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
      const data: LGThreatResponse = await getThreatInfo(collectionID);
      const responseDomains: Domain[] = await saveAndPullDomains(
        data,
        organizationId!,
        scanId
      );
      // Only pull domains that have been seen in the last two months.
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      console.log(`Pulling domains seen since ${twoMonthsAgo}`);
      for (const l of data.results) {
        // Create a dictionary of relevant fields from the API request.
        const lastSeen = new Date(l.lastSeen);
        if (lastSeen > twoMonthsAgo) {
          const val: ParsedLGResponse = {
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
            left_name: l.left.name,
            vulnOrMal:
              l.right.classifications[0] === 'Vulnerable Service'
                ? 'Vulnerability'
                : 'Malware'
          };

          // If we've already seen this domain, add this val to the structuredData field of the associated vulnerability
          if (ipsAndDomains.includes(l.left.name)) {
            for (const Vuln of vulnerabilities) {
              //Match current LookingGlass Object with existing Vulnerability
              if (l.left.name === Vuln.domain.name) {
                let matches = false;
                // If the Vuln type already exists for this Domain keep the most recent instance
                // Loop through the previously created Vulnerabilities structuredData to identify duplicates
                Vuln.structuredData['lookingGlassData'].forEach(function (
                  row,
                  index,
                  array
                ) {
                  // Find a duplicate threat types
                  if (l.right.name === row.right_name) {
                    // If the new value is more recent than existing value, update new values firstSeen date from existing values
                    // first date and then overwrite the existing value
                    if (lastSeen > row.lastSeen) {
                      val.firstSeen = row.firstSeen;
                      array[index] = val;
                      // if the existing value is more recent than the new value then update the existing values firstSeen from the new value
                    } else {
                      row.firstSeen = val.firstSeen;
                    }
                    matches = true;
                  }
                });
                // If there are isn't a duplicate threat type then add value to the StructuredData
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
                const vulnerability = {
                  domain: domain,
                  lastSeen: new Date(Date.now()),
                  title: 'Looking Glass Data',
                  state: 'open',
                  source: 'lookingGlass',
                  needsPopulation: false,
                  structuredData: {
                    lookingGlassData: [val]
                  },
                  description: `Vulnerabilities / malware found by LookingGlass.`
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
      console.log('Vulnerabilities saved to db');
    }
  }
};
