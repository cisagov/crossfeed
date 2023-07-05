import { handler as lookingGlass } from '../lookingGlass';
import * as nock from 'nock';
import {
  connectToDatabase,
  Domain,
  Organization,
  OrganizationTag,
  Scan,
  Service,
  Vulnerability
} from '../../models';

const realDate = Date;
const today = new Date();

const lgResponse = {
  totaHits: 4,
  results: [
    {
      firstSeen: today.getTime() - 4.5 * 24 * 60 * 60 * 1000,
      lastSeen: today.getTime() - 4 * 24 * 60 * 60 * 1000,
      sources: ['Shodan Inferred Vulnerability'],
      right: {
        ticClassificationScores: [40],
        threatId: 'ThreatID_1234',
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        ticCriticality: 50,
        ticSourceScore: 50,
        ticObsInfluence: 0.5,
        ref: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        threatCategories: ['Vulnerable Service'],
        name: 'Vulnerable Product - CiscoWebVPN',
        type: 'threat',
        threatName: 'Vulnerable Product - CiscoWebVPN'
      },
      left: {
        collectionIds: [
          'test_collection_id_1',
          'test_collection_id_2',
          '].`test_collection_id_3'
        ],
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        owners: ['owner1', 'owner2', 'owner3'],
        ref: {
          type: 'ipv4',
          id: 1234567
        },
        name: '123.123.123.123',
        type: 'ipv4',
        threatNames: ['Vulnerable Product - CiscoWebVPN'],
        locations: [
          {
            city: 'testland',
            country: 'USA',
            region: 'FL',
            geoPoint: {
              lon: -55.55,
              lat: 55.55
            },
            countryName: 'United States',
            sources: ['Test_Source'],
            country2Digit: 'US',
            lastSeen: 1620892865376
          }
        ],
        ipv4: 123456789,
        asns: [1234],
        threatIds: ['ThreatID_1234'],
        cidrv4s: ['123.123.12.0/12', '123.123.0.0/12', '123.0.0.0/1']
      },
      ref: {
        type: 'associated-with',
        right: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        left: {
          type: 'ipv4',
          id: 123456789
        }
      }
    },
    {
      firstSeen: today.getTime() - 13 * 24 * 60 * 60 * 1000,
      lastSeen: today.getTime() - 10 * 24 * 60 * 60 * 1000,
      sources: ['Shodan Inferred Vulnerability'],
      right: {
        ticClassificationScores: [40],
        threatId: 'ThreatID_1234',
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        ticCriticality: 50,
        ticSourceScore: 50,
        ticObsInfluence: 0.5,
        ref: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        threatCategories: ['Vulnerable Service'],
        name: 'Vulnerable Product - CiscoWebVPN',
        type: 'threat',
        threatName: 'Vulnerable Product - CiscoWebVPN'
      },
      left: {
        collectionIds: [
          'test_collection_id_1',
          'test_collection_id_2',
          '].`test_collection_id_3'
        ],
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        owners: ['owner1', 'owner2', 'owner3'],
        ref: {
          type: 'ipv4',
          id: 1234567
        },
        name: '123.123.123.123',
        type: 'ipv4',
        threatNames: ['Vulnerable Product - CiscoWebVPN'],
        locations: [
          {
            city: 'testland',
            country: 'USA',
            region: 'FL',
            geoPoint: {
              lon: -55.55,
              lat: 55.55
            },
            countryName: 'United States',
            sources: ['Test_Source'],
            country2Digit: 'US',
            lastSeen: 1620892865376
          }
        ],
        ipv4: 123456789,
        asns: [1234],
        threatIds: ['ThreatID_1234'],
        cidrv4s: ['123.123.12.0/12', '123.123.0.0/12', '123.0.0.0/1']
      },
      ref: {
        type: 'associated-with',
        right: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        left: {
          type: 'ipv4',
          id: 123456789
        }
      }
    },
    {
      firstSeen: today.getTime() - 17 * 24 * 60 * 60 * 1000,
      lastSeen: today.getTime() - 10 * 24 * 60 * 60 * 1000,
      sources: ['Shodan Inferred Vulnerability'],
      right: {
        ticClassificationScores: [50],
        threatId: 'ThreatID_1234',
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        ticCriticality: 50,
        ticSourceScore: 50,
        ticObsInfluence: 0.5,
        ref: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        threatCategories: ['Vulnerable Service'],
        name: 'Scary Malware',
        type: 'threat',
        threatName: 'Scary Malware'
      },
      left: {
        collectionIds: [
          'test_collection_id_1',
          'test_collection_id_5',
          '].`test_collection_id_4'
        ],
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        owners: ['owner1', 'owner2', 'owner3'],
        ref: {
          type: 'ipv4',
          id: 1234567
        },
        name: '100.123.100.123',
        type: 'ipv4',
        threatNames: ['Vulnerable Product - CiscoWebVPN'],
        locations: [
          {
            city: 'testland',
            country: 'USA',
            region: 'TX',
            geoPoint: {
              lon: -55.55,
              lat: 55.55
            },
            countryName: 'United States',
            sources: ['Test_Source'],
            country2Digit: 'US',
            lastSeen: 1620892865376
          }
        ],
        ipv4: 123456789,
        asns: [1245],
        threatIds: ['ThreatID_1234'],
        cidrv4s: ['123.123.123/1', '123.123.123/2', '123.123.123/3']
      },
      ref: {
        type: 'associated-with',
        right: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        left: {
          type: 'ipv4',
          id: 98765432
        }
      }
    },
    {
      firstSeen: today.getTime() - 8 * 24 * 60 * 60 * 1000,
      lastSeen: today.getTime() - 5 * 24 * 60 * 60 * 1000,
      sources: ['Shodan Inferred Vulnerability'],
      right: {
        ticClassificationScores: [50],
        threatId: 'ThreatID_1234',
        classifications: ['Bot'],
        ticScore: 50,
        ticCriticality: 50,
        ticSourceScore: 50,
        ticObsInfluence: 0.5,
        ref: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        threatCategories: ['Spamming Activity'],
        name: 'Scary Malware',
        type: 'threat',
        threatName: 'Scary Malware'
      },
      left: {
        collectionIds: [
          'test_collection_id_1',
          'test_collection_id_5',
          '].`test_collection_id_4'
        ],
        classifications: ['Bot'],
        ticScore: 50,
        owners: ['owner1', 'owner2', 'owner3'],
        ref: {
          type: 'ipv4',
          id: 86421357
        },
        name: '100.123.100.123',
        type: 'ipv4',
        threatNames: ['Gumblar Infection'],
        locations: [
          {
            city: 'testland',
            country: 'USA',
            region: 'UT',
            geoPoint: {
              lon: -55.55,
              lat: 55.55
            },
            countryName: 'United States',
            sources: ['Source3'],
            country2Digit: 'US',
            lastSeen: 1620892865376
          }
        ],
        ipv4: 123459543,
        asns: [1357],
        threatIds: ['ThreatID_1234'],
        cidrv4s: ['123.123.12.0/12', '123.123.0.0/12', '123.0.0.0/1']
      },
      ref: {
        type: 'associated-with',
        right: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        left: {
          type: 'ipv4',
          id: 86421357
        }
      }
    },
    {
      firstSeen: today.getTime() - 9 * 24 * 60 * 60 * 1000,
      lastSeen: today.getTime() - 7 * 24 * 60 * 60 * 1000,
      sources: ['Shodan Inferred Vulnerability'],
      right: {
        ticClassificationScores: [50],
        threatId: 'ThreatID_1234',
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        ticCriticality: 50,
        ticSourceScore: 50,
        ticObsInfluence: 0.5,
        ref: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        threatCategories: ['Vulnerable Service'],
        name: 'Vulnerable Product - CiscoWebVPN',
        type: 'threat',
        threatName: 'Vulnerable Product - CiscoWebVPN'
      },
      left: {
        collectionIds: [
          'test_collection_id_1',
          'test_collection_id_5',
          '].`test_collection_id_4'
        ],
        classifications: ['Vulnerable Service'],
        ticScore: 50,
        owners: ['owner1', 'owner2', 'owner3'],
        ref: {
          type: 'ipv4',
          id: 1234509876
        },
        name: '1.123.135.123',
        type: 'ipv4',
        threatNames: ['Vulnerable Product - CiscoWebVPN'],
        locations: [
          {
            city: 'testland',
            country: 'USA',
            region: 'CO',
            geoPoint: {
              lon: -55.55,
              lat: 55.55
            },
            countryName: 'United States',
            sources: ['Source4'],
            country2Digit: 'US',
            lastSeen: 1620892865376
          }
        ],
        ipv4: 135798642,
        asns: [4321],
        threatIds: ['ThreatID_1234'],
        cidrv4s: ['123.123.12.0/12', '123.123.0.0/12', '123.0.0.0/1']
      },
      ref: {
        type: 'associated-with',
        right: {
          type: 'threat',
          id: 'ThreatID_1234'
        },
        left: {
          type: 'ipv4',
          id: 1234509876
        }
      }
    }
  ]
};
let orgName;
let orgResponse;

describe('lookingGlass', () => {
  let organization;
  let tag1;
  let tag2;
  let scan;
  let domains: Domain[] = [];
  let connection;
  beforeEach(async () => {
    orgName = 'Collection-' + Math.random();
    orgResponse = [
      {
        children: [],
        createdAt: '2020-05-19T19:09:07.445Z',
        createdBy: 'Created_By_ID_1',
        id: 'Collection_Id_1',
        name: orgName,
        ticScore: 50,
        updatedAt: '2020-05-19T19:09:07.445Z',
        updatedBy: '>&,Mx}mU_XG;3ns1Bw}:q+Khu'
      },
      {
        description: '',
        children: [],
        ticScore: 50,
        updatedAt: '2020-09-01T13:58:14.163Z',
        createdBy: 'Created_By_ID_2',
        name: 'Collection_2',
        createdAt: '2020-05-19T19:09:26.620Z',
        updatedBy: '>&,Mx}mU_XG;3ns1Bw}:q+Khu',
        id: 'Collection_Id_2'
      }
    ];
    connection = await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2019-04-22T10:20:30Z').getTime());
    tag1 = await OrganizationTag.create({
      name: 'P&E'
    }).save;
    tag2 = await OrganizationTag.create({
      name: 'TestOrgID'
    }).save;
    organization = await Organization.create({
      name: orgName,
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false,
      tags: [tag1, tag2]
    }).save();
    scan = await Scan.create({
      name: 'lookingGlass',
      arguments: {},
      frequency: 999
    }).save();
    domains = [
      await Domain.create({
        name: '1.123.135.123',
        ip: '1.123.135.123',
        organization
      }).save(),
      await Domain.create({
        name: '100.123.100.123',
        ip: '100.123.100.123',
        organization
      }).save(),
      await Domain.create({
        name: '123.123.123.123',
        ip: '123.123.123.123',
        organization
      }).save()
    ];

    jest.mock('../helpers/getIps', () => domains);
  });

  afterEach(async () => {
    global.Date = realDate;
    jest.unmock('../helpers/getIps');
    await connection.close();
  });
  afterAll(async () => {
    nock.cleanAll();
  });
  const checkDomains = async (organization) => {
    const domains = await Domain.find({
      where: { organization },
      relations: ['organization', 'services']
    });
    expect(
      domains
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({
          ...e,
          services: e.services.map((s) => ({
            ...s,
            id: null,
            updatedAt: null,
            createdAt: null
          })),
          organization: null,
          id: null,
          updatedAt: null,
          createdAt: null,
          syncedAt: null,
          name: null
        }))
    ).toMatchSnapshot();
    expect(domains.filter((e) => !e.organization).length).toEqual(0);
  };
  test('basic test', async () => {
    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .get(
        '/api/v1/workspaces/' +
          encodeURIComponent(process.env.LG_WORKSPACE_NAME!) +
          '/collections'
      )
      .reply(200, orgResponse);

    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .post('/api/graph/query', {
        period: 'all',
        query: [
          'and',
          ['=', 'type', ['associated-with']],
          ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
          ['=', 'left.collectionIds', 'Collection_Id_1']
        ],
        fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
        limit: 100000,
        workspaceIds: []
      })
      .reply(200, lgResponse);
    await lookingGlass({
      organizationId: organization.id,
      organizationName: orgName,
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    await checkDomains(organization);
  });

  test('creates vulnerability', async () => {
    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .get(
        '/api/v1/workspaces/' +
          encodeURIComponent(process.env.LG_WORKSPACE_NAME!) +
          '/collections'
      )
      .reply(200, orgResponse);

    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .post('/api/graph/query', {
        period: 'all',
        query: [
          'and',
          ['=', 'type', ['associated-with']],
          ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
          ['=', 'left.collectionIds', 'Collection_Id_1']
        ],
        fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
        limit: 100000,
        workspaceIds: []
      })
      .reply(200, lgResponse);
    await lookingGlass({
      organizationId: organization.id,
      organizationName: orgName,
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const domain = await Domain.findOne({ id: domains[0].id });
    const vulns = await Vulnerability.find({
      domain: domain
    });
    expect(vulns).toHaveLength(1);
    expect(vulns[0].title).toEqual('Looking Glass Data');
    expect(vulns[0].source).toEqual('lookingGlass');
  });

  test('updates existing vulnerability', async () => {
    const domain = await Domain.findOne({ id: domains[0].id });
    const vulnerability = await Vulnerability.create({
      domain,
      cve: null,
      lastSeen: new Date(Date.now()),
      cpe: null,
      title: `Looking Glass Data`,
      description: '123',
      state: 'closed',
      structuredData: {
        lookingGlassData: [
          {
            firstSeen: today.getTime() - 25 * 24 * 60 * 60 * 1000,
            lastSeen: today.getTime() - 15 * 24 * 60 * 60 * 1000,
            sources: ['Shodan Inferred Vulnerability'],
            ref_type: 'associated-with',
            ref_right_type: 'threat',
            ref_right_id: 'ThreatID_1234',
            ref_left_type: 'ipv4',
            ref_left_id: 1234509876,

            right_ticScore: 50,
            right_classifications: ['Vulnerable Service'],
            right_name: 'test_name',

            left_type: 'ipv4',
            left_ticScore: 50,
            left_name: '1.123.135.123',
            vulnOrMal: 'Vulnerable Service'
          }
        ]
      },
      substate: 'remediated',
      source: 'lookingGlass'
    }).save();
    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .get(
        '/api/v1/workspaces/' +
          encodeURIComponent(process.env.LG_WORKSPACE_NAME!) +
          '/collections'
      )
      .reply(200, orgResponse);

    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .post('/api/graph/query', {
        period: 'all',
        query: [
          'and',
          ['=', 'type', ['associated-with']],
          ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
          ['=', 'left.collectionIds', 'Collection_Id_1']
        ],
        fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
        limit: 100000,
        workspaceIds: []
      })
      .reply(200, lgResponse);
    await lookingGlass({
      organizationId: organization.id,
      organizationName: orgName,
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const vulns = await Vulnerability.find({
      where: { domain }
    });
    expect(vulns).toHaveLength(1);

    // These fields should stay the same
    expect(vulns[0].title).toEqual('Looking Glass Data');
    expect(vulns[0].id).toEqual(vulnerability.id);
    expect(vulns[0].cpe).toEqual(vulnerability.cpe);
    expect(vulns[0].source).toEqual(vulnerability.source);
    // These fields should be updated
    expect(vulns[0].state).toEqual(vulnerability.state);
    expect(
      new Date(vulns[0].structuredData['lookingGlassData'][0].lastSeen)
    ).toEqual(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
    expect(vulns[0].structuredData['lookingGlassData'][0].right_name).toEqual(
      'Vulnerable Product - CiscoWebVPN'
    );
    expect(vulns[0].updatedAt).not.toEqual(vulnerability.updatedAt);
  });

  test('Merge duplicates successfully', async () => {
    const domain = await Domain.findOne({ id: domains[1].id });
    const vulnerability = await Vulnerability.create({
      domain,
      cve: null,
      lastSeen: new Date(Date.now()),
      cpe: null,
      title: `Looking Glass Data`,
      description: '123',
      state: 'closed',
      structuredData: {
        lookingGlassData: [
          {
            firstSeen: today.getTime() - 25 * 24 * 60 * 60 * 1000,
            lastSeen: today.getTime() - 22 * 24 * 60 * 60 * 1000,
            sources: ['Shodan Inferred Vulnerability'],
            ref_type: 'associated-with',
            ref_right_type: 'threat',
            ref_right_id: 'ThreatID_1234',
            ref_left_type: 'ipv4',
            ref_left_id: 1234509876,

            right_ticScore: 50,
            right_classifications: ['Vulnerable Service'],
            right_name: 'Scary Malware',

            left_type: 'ipv4',
            left_ticScore: 50,
            left_name: '100.123.100.123',
            vulnOrMal: 'Malware'
          }
        ]
      },
      substate: 'remediated',
      source: 'lookingGlass'
    }).save();
    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .get(
        '/api/v1/workspaces/' +
          encodeURIComponent(process.env.LG_WORKSPACE_NAME!) +
          '/collections'
      )
      .reply(200, orgResponse);

    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .post('/api/graph/query', {
        period: 'all',
        query: [
          'and',
          ['=', 'type', ['associated-with']],
          ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
          ['=', 'left.collectionIds', 'Collection_Id_1']
        ],
        fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
        limit: 100000,
        workspaceIds: []
      })
      .reply(200, lgResponse);
    await lookingGlass({
      organizationId: organization.id,
      organizationName: orgName,
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const vulns = await Vulnerability.find({
      where: { domain },
      relations: ['service']
    });
    expect(
      new Date(vulns[0].structuredData['lookingGlassData'][0].firstSeen)
    ).toEqual(new Date(today.getTime() - 17 * 24 * 60 * 60 * 1000));
    expect(
      new Date(vulns[0].structuredData['lookingGlassData'][0].lastSeen)
    ).toEqual(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000));
  });

  test('Merge duplicate threats successfully', async () => {
    console.log('Running Merge test');
    const domain = await Domain.findOne({ id: domains[2].id });
    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .get(
        '/api/v1/workspaces/' +
          encodeURIComponent(process.env.LG_WORKSPACE_NAME!) +
          '/collections'
      )
      .reply(200, orgResponse);

    nock('https://delta.lookingglasscyber.com', {
      reqheaders: {
        Authorization: 'Bearer ' + process.env.LG_API_KEY
      }
    })
      .post('/api/graph/query', {
        period: 'all',
        query: [
          'and',
          ['=', 'type', ['associated-with']],
          ['or', ['=', 'right.type', 'threat'], ['=', 'left.type', 'ipv4']],
          ['=', 'left.collectionIds', 'Collection_Id_1']
        ],
        fields: ['firstSeen', 'lastSeen', 'sources', 'right', 'left'],
        limit: 100000,
        workspaceIds: []
      })
      .reply(200, lgResponse);
    await lookingGlass({
      organizationId: organization.id,
      organizationName: orgName,
      scanId: scan.id,
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
    const vulns = await Vulnerability.find({
      where: { domain },
      relations: ['service']
    });
    expect(
      new Date(vulns[0].structuredData['lookingGlassData'][0].firstSeen)
    ).toEqual(new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000));
    expect(
      new Date(vulns[0].structuredData['lookingGlassData'][0].lastSeen)
    ).toEqual(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000));
  });
});
