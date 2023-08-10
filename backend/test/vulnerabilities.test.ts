import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  Vulnerability,
  OrganizationTag,
  UserType
} from '../src/models';
import { createUserToken } from './util';
jest.mock('../src/tasks/s3-client');
const saveCSV = require('../src/tasks/s3-client').saveCSV as jest.Mock;

describe('vulnerabilities', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  describe('export', () => {
    it('export by org user should only return vulnerabilities from that org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/export')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body).toEqual({ url: 'http://mock_url' });
      expect(saveCSV).toBeCalledTimes(1);
      expect(saveCSV.mock.calls[0][0]).toContain(vulnerability.title);
      expect(saveCSV.mock.calls[0][0]).not.toContain(vulnerability2.title);
    });
  });
  describe('list', () => {
    it('list by org user should only return vulnerabilities from that org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(vulnerability.id);
    });
    it('list by globalView should return vulnerabilities from all orgs', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const title = 'test-' + Math.random();
      const vulnerability = await Vulnerability.create({
        title: title + '-1',
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: title + '-2',
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { title }
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
    });
    it('list by globalView with org filter should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const title = 'test-' + Math.random();
      const vulnerability = await Vulnerability.create({
        title: title + '-1',
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: title + '-2',
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { organization: organization.id }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(vulnerability.id);
    });
    it('list by globalView with tag filter should work', async () => {
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag]
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const title = 'test-' + Math.random();
      const vulnerability = await Vulnerability.create({
        title: title + '-1',
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: title + '-2',
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { tag: tag.id }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(vulnerability.id);
    });
    it('list by globalView with isKev filter should work', async () => {
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag]
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const title = 'test-' + Math.random();
      const vulnerability = await Vulnerability.create({
        title: title + '-1',
        isKev: true,
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: title + '-2',
        isKev: false,
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { organization: organization.id, isKev: true }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(vulnerability.id);

      const response2 = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { organization: organization.id, isKev: false }
        })
        .expect(200);
      expect(response2.body.count).toEqual(1);
      expect(response2.body.result[0].id).toEqual(vulnerability2.id);
    });
    it('list by org user with custom pageSize should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          pageSize: 1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(1);
    });
    it('list by org user with pageSize of -1 should return all results', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          pageSize: -1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(2);
    });
    it('list by org user with groupBy set should group results', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'CVE-9999-0001',
        cve: 'CVE-9999-0001',
        severity: 'High',
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'CVE-9999-0001',
        cve: 'CVE-9999-0001',
        severity: 'High',
        domain: domain2
      }).save();
      const vulnerability3 = await Vulnerability.create({
        title: 'CVE-9999-0003',
        cve: 'CVE-9999-0003',
        severity: 'High',
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          groupBy: 'title'
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(2);
      expect(response.body.result).toEqual([
        {
          cve: 'CVE-9999-0001',
          isKev: false,
          severity: 'High',
          cnt: '2',
          description: '',
          title: 'CVE-9999-0001'
        },
        {
          cve: 'CVE-9999-0003',
          isKev: false,
          severity: 'High',
          cnt: '1',
          description: '',
          title: 'CVE-9999-0003'
        }
      ]);
    });
  });
  describe('get', () => {
    it("get by org user should work for vulnerability in the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(vulnerability.id);
    });
    it("get by org user should not work for vulnerability not in the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(404);
      expect(response.body).toEqual({});
    });
    it('get by globalView should work for any vulnerability', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(vulnerability.id);
    });
  });

  describe('update', () => {
    it("update by org user should work for vulnerability in the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain,
        state: 'open',
        substate: 'unconfirmed'
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .put(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          substate: 'remediated'
        })
        .expect(200);
      expect(response.body.state).toEqual('closed');
      expect(response.body.substate).toEqual('remediated');
    });
    it('update by global admin should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain,
        state: 'open',
        substate: 'unconfirmed'
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .put(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          substate: 'remediated'
        })
        .expect(200);
      expect(response.body.state).toEqual('closed');
      expect(response.body.substate).toEqual('remediated');
    });
    it("update by org user should not work for vulnerability outside the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain,
        state: 'open',
        substate: 'unconfirmed'
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .put(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization2.id, role: 'user' }]
          })
        )
        .send({
          substate: 'remediated'
        })
        .expect(404);
    });
  });
});
