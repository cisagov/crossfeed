import { Domain, Service, Vulnerability } from '../models';
import getIps from './helpers/getIps';
import { CommandOptions } from './ecs-client';
import got from 'got';
import { plainToClass } from 'class-transformer';
import saveVulnerabilitiesToDb from './helpers/saveVulnerabilitiesToDb';
import { Object } from 'aws-sdk/clients/appflow';

const username: string = 'dane.jensen@associates.cisa.dhs.gov';
const passcode: string = 'Telescope&Moon77';
// let url:string = '/auth/login'

async function getAuth() {
  const results: any[] = await got
    .post('https://delta.lookingglasscyber.com' + '/auth/login', {
      json: { params: { username: username, password: passcode } },
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
    Authorization: 'Bearer 30f41661a577424fbd791b865dac9efe'
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

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

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

  console.log(collections);
  for (const line of collections['result']) {
    if (organizationName == line['name']) {
      const collectionID = line['collection-id'];
      console.log(line['name']);
      const data = await getThreatInfo(sessionToken, collectionID);
      for (const l of data['results']) {
        console.log(l['right']);
      }
    }
  }
};

// def connect(self, resource, user, passcode):
//         requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
//         url = resource

//         r = requests.post(url, json=params, headers=h1)
//         if r.status_code == 200:
//             try:
//                 parsed_json = json.loads(r.text)
//                 return parsed_json

//             except:
//                 pass

//         else:
//             result =  'Bad status code response: %s' % r.status_code
//             return result
