import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken, DUMMY_USER_ID } from './util';
import {
  Organization,
  Role,
  connectToDatabase,
  Scan,
  ScanTask,
  User
} from '../src/models';

describe('organizations', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  describe('create', () => {
    it('create by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: 'globalAdmin'
      }).save();
      const name = 'test-' + Math.random();
      const response = await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: 'globalAdmin'
          })
        )
        .send({
          ipBlocks: [],
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          inviteOnly: true
        })
        .expect(200);
      expect(response.body).toMatchSnapshot({
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: expect.any(String),
        name: expect.any(String),
        createdBy: {
          id: expect.any(String)
        }
      });
      expect(response.body.createdBy.id).toEqual(user.id);
      expect(response.body.name).toEqual(name);
    });
    it("can't add organization with the same name", async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: 'globalAdmin'
      }).save();
      const name = 'test-' + Math.random();
      await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: 'globalAdmin'
          })
        )
        .send({
          ipBlocks: [],
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          inviteOnly: true
        });
      // .expect(200);
      const response = await request(app)
        .post('/organizations/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: 'globalAdmin'
          })
        )
        .send({
          ipBlocks: [],
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          inviteOnly: true
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
            userType: 'globalView'
          })
        )
        .send({
          ipBlocks: [],
          name,
          rootDomains: ['cisa.gov'],
          isPassive: false,
          inviteOnly: true
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('update', () => {
    it('update by globalAdmin should succeed', async () => {
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
      const inviteOnly = false;
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .send({
          name,
          rootDomains,
          ipBlocks,
          isPassive,
          inviteOnly
        })
        .expect(200);
      expect(response.body.name).toEqual(name);
      expect(response.body.rootDomains).toEqual(rootDomains);
      expect(response.body.ipBlocks).toEqual(ipBlocks);
      expect(response.body.isPassive).toEqual(isPassive);
      expect(response.body.inviteOnly).toEqual(inviteOnly);
    });
    it('update by org admin should update everything but rootDomains and ipBlocks', async () => {
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
      const inviteOnly = false;
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
          })
        )
        .send({
          name,
          rootDomains,
          ipBlocks,
          isPassive,
          inviteOnly
        })
        .expect(200);
      expect(response.body.name).toEqual(name);
      expect(response.body.rootDomains).toEqual(organization.rootDomains);
      expect(response.body.ipBlocks).toEqual(organization.ipBlocks);
      expect(response.body.isPassive).toEqual(isPassive);
      expect(response.body.inviteOnly).toEqual(inviteOnly);
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
      const inviteOnly = false;
      const response = await request(app)
        .put(`/organizations/${organization.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          name,
          rootDomains,
          ipBlocks,
          isPassive,
          inviteOnly
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
            userType: 'globalAdmin'
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
            userType: 'globalView'
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
            userType: 'globalView'
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
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .expect(200);
      expect(response.body.length).toEqual(1);
      expect(response.body[0].id).toEqual(organization.id);
    });
  });
  describe('listPublicNames', () => {
    it('listPublicNames by non-org member should succeed', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        inviteOnly: false
      }).save();
      const response = await request(app)
        .get(`/organizations/public`)
        .set('Authorization', createUserToken({}))
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.map((e) => e.id).indexOf(organization.id)
      ).not.toEqual(-1);
    });
    it('listPublicNames with bad auth key should fail', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        inviteOnly: false
      }).save();
      const response = await request(app)
        .get(`/organizations/public`)
        .set('Authorization', '')
        .expect(401);
      expect(response.body).toEqual({});
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
            userType: 'globalView'
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
    it('enabling a scan by org admin for an organization should succeed', async () => {
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
    it('disabling a scan by org admin for an organization should succeed', async () => {
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
        isGranular: true
      }).save();
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
    it('enabling a scan by org user for an organization should fail', async () => {
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
      const response = await request(app)
        .post(
          `/organizations/${organization.id}/granularScans/${scan.id}/update`
        )
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .send({
          enabled: true
        })
        .expect(403);
    });
    it('enabling a scan by globalAdmin for an organization should succeed', async () => {
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
            userType: 'globalAdmin'
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
            userType: 'globalAdmin'
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
            userType: 'globalView'
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
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
            userType: 'globalAdmin'
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
            userType: 'globalView'
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
            roles: [
              {
                org: organization.id,
                role: 'admin'
              }
            ]
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
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
});
