import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken, DUMMY_USER_ID } from './util';
import {
  Organization,
  Role,
  connectToDatabase,
  Scan,
  ScanTask,
  User,
  OrganizationTag,
  UserType
} from '../src/models';
const dns = require('dns');

describe('organizations', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  describe('create', () => {
    it('create by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.GLOBAL_ADMIN
      }).save();
      const name = 'test-' + Math.random();
      const acronym = Math.random().toString(36).slice(2, 7);
      const response = await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          ipBlocks: [],
          acronym: acronym,
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          tags: [{ name: 'test' }]
        })
        .expect(200);
      expect(response.body.createdBy.id).toEqual(user.id);
      expect(response.body.name).toEqual(name);
      expect(response.body.tags[0].name).toEqual('test');
    });
    it("can't add organization with the same acronym", async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.GLOBAL_ADMIN
      }).save();
      const name = 'test-' + Math.random();
      const acronym = Math.random().toString(36).slice(2, 7);
      await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          ipBlocks: [],
          name,
          acronym: acronym,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          tags: []
        })
        .expect(200);
      const response = await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          ipBlocks: [],
          name,
          acronym: acronym,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          tags: []
        })
        .expect(500);
      expect(response.body).toMatchSnapshot();
    });
    it('create by globalView should fail', async () => {
      const name = 'test-' + Math.random();
      const response = await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          ipBlocks: [],
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('update', () => {
    it('update by globalAdmin should succeed', async () => {
      const organization = await Organization.create({
        acronym: Math.random().toString(36).slice(2, 7),
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const acronym = Math.random().toString(36).slice(2, 7);
      const rootDomains = ['test-' + Math.random()];
      const ipBlocks = ['1.1.1.1'];
      const isPassive = true;
      const tags = [{ name: 'test' }];
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          name,
          acronym,
          rootDomains,
          ipBlocks,
          isPassive,
          tags
        })
        .expect(200);
      expect(response.body.name).toEqual(name);
      expect(response.body.rootDomains).toEqual(rootDomains);
      expect(response.body.ipBlocks).toEqual(ipBlocks);
      expect(response.body.isPassive).toEqual(isPassive);
      expect(response.body.tags[0].name).toEqual(tags[0].name);
    });
    it('update by org admin should update everything but rootDomains and ipBlocks', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        acronym: Math.random().toString(36).slice(2, 7),
        rootDomains: ['test-' + Math.random()],
        pendingDomains: [{ name: 'test-' + Math.random(), token: '1234' }],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const acronym = Math.random().toString(36).slice(2, 7);
      const rootDomains = ['test-' + Math.random()];
      const ipBlocks = ['1.1.1.1'];
      const isPassive = true;
      const pendingDomains = [{ name: 'test-' + Math.random(), token: '1234' }];
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          name,
          acronym,
          rootDomains,
          ipBlocks,
          isPassive,
          pendingDomains
        })
        .expect(200);
      expect(response.body.name).toEqual(name);
      expect(response.body.rootDomains).toEqual(organization.rootDomains);
      expect(response.body.pendingDomains).toEqual([]); // Pending domains should support removing, but not adding, domains
      expect(response.body.ipBlocks).toEqual(organization.ipBlocks);
      expect(response.body.isPassive).toEqual(isPassive);
    });
    it('update by globalView should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'test-' + Math.random();
      const rootDomains = ['test-' + Math.random()];
      const ipBlocks = ['1.1.1.1'];
      const isPassive = true;
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          name,
          rootDomains,
          ipBlocks,
          isPassive
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('delete', () => {
    it('delete by globalAdmin should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .delete(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(200);
      expect(response.body.affected).toEqual(1);
    });
    it('delete by org admin should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .delete(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('delete by globalView should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .delete(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('list', () => {
    it('list by globalView should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get(`/organizations`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    it('list by org member should only get their org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      // this org should not show up in the response
      await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get(`/organizations`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(200);
      expect(response.body.length).toEqual(1);
      expect(response.body[0].id).toEqual(organization.id);
    });
  });
  describe('get', () => {
    it('get by globalView should fail - TODO should we change this?', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('get by an org admin user should pass', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(200);
      expect(response.body.name).toEqual(organization.name);
    });
    it('get by an org admin user of a different org should fail', async () => {
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
      const response = await request(app)
        .get(`/organizations/${organization2.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('get by an org regular user should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('get by an org admin user should return associated scantasks', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const scanTask = await ScanTask.create({
        scan,
        status: 'created',
        type: 'fargate',
        organization
      }).save();
      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(200);
      expect(response.body.name).toEqual(organization.name);
      expect(response.body.scanTasks.length).toEqual(1);
      expect(response.body.scanTasks[0].id).toEqual(scanTask.id);
      expect(response.body.scanTasks[0].scan.id).toEqual(scan.id);
    });
  });
  describe('update', () => {
    it('enabling a user-modifiable scan by org admin for an organization should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isUserModifiable: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          enabled: true
        })
        .expect(200);
      expect(response.body.granularScans.length).toEqual(1);
      const updated = (await Organization.findOne(
        {
          id: organization.id
        },
        {
          relations: ['granularScans']
        }
      )) as Organization;
      expect(updated.name).toEqual(organization.name);
      expect(updated.granularScans).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: scan.id
          })
        ])
      );
    });
    it('disabling a user-modifiable scan by org admin for an organization should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        organizations: [organization],
        isGranular: true,
        isUserModifiable: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          enabled: false
        })
        .expect(200);
      const updated = (await Organization.findOne(
        {
          id: organization.id
        },
        {
          relations: ['granularScans']
        }
      )) as Organization;
      expect(updated.name).toEqual(organization.name);
      expect(updated.granularScans).toEqual([]);
    });
    it('enabling a user-modifiable scan by org user for an organization should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isUserModifiable: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          enabled: true
        })
        .expect(403);
    });
    it('enabling a user-modifiable scan by globalAdmin for an organization should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isUserModifiable: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          enabled: true
        })
        .expect(200);
      const updated = (await Organization.findOne(
        {
          id: organization.id
        },
        {
          relations: ['granularScans']
        }
      )) as Organization;
      expect(updated.name).toEqual(organization.name);
      expect(updated.granularScans).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: scan.id
          })
        ])
      );
    });
    it('enabling a non-user-modifiable scan by org admin for an organization should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        isGranular: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          enabled: true
        })
        .expect(404);
    });
  });
  describe('approveRole', () => {
    it('approveRole by globalAdmin should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      let role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/approve`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(200);
      expect(response.body).toEqual({});

      role = (await Role.findOne(role.id, {
        relations: ['approvedBy']
      })) as Role;
      expect(role.approved).toEqual(true);
      expect(role.approvedBy.id).toEqual(DUMMY_USER_ID);
    });
    it('approveRole by globalView should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/approve`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('approveRole by org admin should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/approve`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(200);
      expect(response.body).toEqual({});
    });
    it('approveRole by org user should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/approve`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('removeRole', () => {
    it('removeRole by globalAdmin should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/remove`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(200);
      expect(response.body.affected).toEqual(1);
    });
    it('removeRole by globalView should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/remove`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('removeRole by org admin should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/remove`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .expect(200);
      expect(response.body.affected).toEqual(1);
    });
    it('removeRole by org user should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const role = await Role.create({
        role: 'user',
        approved: false,
        organization
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/roles/${role.id}/remove`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('getTags', () => {
    it('getTags by globalAdmin should work', async () => {
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      });
      const response = await request(app)
        .get(`/organizations/tags`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    it('getTags by standard user should return no tags', async () => {
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      });
      const response = await request(app)
        .get(`/organizations/tags`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.STANDARD
          })
        )
        .expect(200);
      expect(response.body).toHaveLength(0);
    });
  });
  describe('initiateDomainVerification', () => {
    it('initiateDomainVerification by org user should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('initiateDomainVerification by org admin should add pending domain', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: 'example.com'
        })
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toEqual('example.com');
    });
    it('initiateDomainVerification for existing root domain should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: organization.rootDomains[0]
        })
        .expect(422);
    });
    it('initiateDomainVerification for existing pending domain should return same token', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        pendingDomains: [
          { name: 'test' + Math.random(), token: 'test' + Math.random() }
        ],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: organization.pendingDomains[0].name
        })
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body).toEqual(organization.pendingDomains);
    });
  });
  describe('checkDomainVerification', () => {
    it('checkDomainVerification by org user should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post(`/organizations/${organization.id}/checkDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('checkDomainVerification by org admin for domain that has DNS record created should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response1 = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: 'example.com'
        })
        .expect(200);
      dns.promises.resolveTxt = jest.fn(() => [
        ['test'],
        [response1.body[0].token]
      ]);
      const response2 = await request(app)
        .post(`/organizations/${organization.id}/checkDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: 'example.com'
        })
        .expect(200);
      expect(response2.body.success).toEqual(true);
      expect(response2.body.organization.rootDomains).toContain('example.com');
    });
    it('checkDomainVerification by org admin for domain that does not have DNS record created should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response1 = await request(app)
        .post(`/organizations/${organization.id}/initiateDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: 'example.com'
        })
        .expect(200);
      dns.promises.resolveTxt = jest.fn(() => [['test']]);
      const response2 = await request(app)
        .post(`/organizations/${organization.id}/checkDomainVerification`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'admin' }]
          })
        )
        .send({
          domain: 'example.com'
        })
        .expect(200);
      expect(response2.body.success).toEqual(false);
    });
  });
});
