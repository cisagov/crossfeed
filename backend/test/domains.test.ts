import * as request from 'supertest';
import app from '../src/api/app';
import {
  Domain,
  connectToDatabase,
  Organization,
  Webpage,
  OrganizationTag,
  Service,
  UserType
} from '../src/models';
import { createUserToken } from './util';
jest.mock('../src/tasks/s3-client');
const saveCSV = require('../src/tasks/s3-client').saveCSV as jest.Mock;

describe('domains', () => {
  let organization;
  let organization2;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    organization2 = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  afterAll(async () => {
    await connection.close();
  });

  describe('export', () => {
    it('export by org user should only return domains from that org', async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Service.create({
        domain,
        port: 443,
        wappalyzerResults: [
          {
            technology: {
              cpe: 'cpe:/a:software',
              name: 'technology name',
              slug: 'slug',
              icon: 'icon',
              website: 'website',
              categories: []
            },
            version: '0.0.1'
          }
        ]
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/export')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(200);
      expect(response.body).toEqual({ url: 'http://mock_url' });
      expect(saveCSV).toBeCalledTimes(1);
      expect(saveCSV.mock.calls[0][0]).toContain(name);
      expect(saveCSV.mock.calls[0][0]).toContain('technology name');
      expect(saveCSV.mock.calls[0][0]).toContain('0.0.1');
      expect(saveCSV.mock.calls[0][0]).toContain('443');
      expect(saveCSV.mock.calls[0][0]).not.toContain(name + '-2');
    });
  });
  describe('list', () => {
    it('list by org user should only return domains from that org', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].organization.name).toEqual(
        organization.name
      );
    });
    it('list by globalView should return domains from all orgs', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
    });
    it('list by globalView with org filter should only return domains from that org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
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
      expect(response.body.result[0].id).toEqual(domain.id);
    });
    it('list by globalView with org name filter should only return domains from that org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { organizationName: organization.name }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(domain.id);
    });
    it('list by globalView with tag filter should only return domains from orgs with that tag', async () => {
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
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
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
      expect(response.body.result[0].id).toEqual(domain.id);
    });
    it('list by org user with custom pageSize should work', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name: name + '-1',
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name },
          pageSize: 1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(1);
    });
    it('list by org user with pageSize of -1 should return all domains', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name: name + '-1',
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name },
          pageSize: -1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(2);
    });
    /*ToU tests begin here*/
    it("list by org user that hasn't signed the terms should fail", async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            dateAcceptedTerms: undefined,
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(403);
      expect(response.text).toContain('must accept terms');
    });

    it("list by org user that hasn't signed the correct ToU should fail", async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            dateAcceptedTerms: new Date(),
            acceptedTermsVersion: 'v0-user',
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(403);
      expect(response.text).toContain('must accept terms');
    });

    it('list by org admin that has signed user level ToU should fail', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            dateAcceptedTerms: new Date(),
            acceptedTermsVersion: 'v1-user',
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(403);
      expect(response.text).toContain('must accept terms');
    });

    it('list by org admin that has signed correct ToU should succeed', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2',
        organization: organization2
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            dateAcceptedTerms: new Date(),
            acceptedTermsVersion: 'v1-admin',
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(200);
    });
  });
  describe('get', () => {
    it("get by org user should work for domain in the user's org", async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      const webpage = await Webpage.create({
        domain,
        url: 'http://url',
        status: 200
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(domain.id);
      // expect(response.body.webpages.length).toEqual(1);
    });
    it("get by org user should not work for domain not in the user's org", async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization: organization2
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(404);
      expect(response.body).toEqual({});
    });
    it('get by globalView should work for any domain', async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization: organization2
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(domain.id);
    });
  });
});
