import * as request from 'supertest';
import app from '../src/api/app';
import { User, connectToDatabase, Organization, Role } from '../src/models';
import { createUserToken } from './util';

describe('user', () => {
  let organization;
  let organization2;
  beforeAll(async () => {
    await connectToDatabase();
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
  describe('invite', () => {
    it('invite by a regular user should not work', async () => {
      const name = 'test-' + Math.random();
      const firstName = 'first name';
      const lastName = 'last name';
      const email = Math.random() + '@crossfeed.cisa.gov';
      const response = await request(app)
        .post('/users')
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
          firstName,
          lastName,
          email
        })
        .expect(403);
    });
    it('invite by an organization admin should work', async () => {
      const firstName = 'first name';
      const lastName = 'last name';
      const email = Math.random() + '@crossfeed.cisa.gov';
      const response = await request(app)
        .post('/users')
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
          firstName,
          lastName,
          email,
          organization: organization.id,
          organizationAdmin: false
        })
        .expect(200);
      expect(response.body.email).toEqual(email);
      expect(response.body.invitePending).toEqual(true);
      expect(response.body.firstName).toEqual(firstName);
      expect(response.body.lastName).toEqual(lastName);
      expect(response.body.roles[0].approved).toEqual(true);
      expect(response.body.roles[0].role).toEqual('user');
    });
    it('invite existing user by a different organization admin should work, and should modify other user details', async () => {
      const firstName = 'first name';
      const lastName = 'last name';
      const email = Math.random() + '@crossfeed.cisa.gov';
      const user = await User.create({
        firstName: 'original first name',
        lastName: 'original last name',
        email
      }).save();
      await Role.create({
        role: 'user',
        approved: false,
        organization,
        user
      }).save();
      const response = await request(app)
        .post('/users')
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization2.id,
                role: 'admin'
              }
            ]
          })
        )
        .send({
          firstName,
          lastName,
          email,
          organization: organization2.id,
          organizationAdmin: false
        })
        .expect(200);
      expect(response.body.id).toEqual(user.id);
      expect(response.body.email).toEqual(email);
      expect(response.body.invitePending).toEqual(false);
      expect(response.body.firstName).toEqual('first name');
      expect(response.body.lastName).toEqual('last name');
      expect(response.body.roles[1].approved).toEqual(true);
      expect(response.body.roles[1].role).toEqual('user');
    });
  });
  describe('me', () => {
    it("me by a regular user should give that user's information", async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .get('/users/me')
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .expect(200);
      expect(response.body.email).toEqual(user.email);
    });
  });
  describe('list', () => {
    it('list by globalView should give all users', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .get('/users')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.map((e) => e.id).indexOf(user.id)).not.toEqual(-1);
    });
    it('list by regular user should fail', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .get('/users')
        .set('Authorization', createUserToken({}))
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('delete', () => {
    it('delete by globalAdmin should work', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .del(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .expect(200);
      expect(response.body.affected).toEqual(1);
    });
    it('delete by globalView should not work', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .del(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('delete by regular user should not work', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .del(`/users/${user.id}`)
        .set('Authorization', createUserToken({}))
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('delete by regular user on themselves should work', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .del(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .expect(200);
      expect(response.body.affected).toEqual(1);
    });
  });
  describe('update', () => {
    let user, firstName, lastName, orgId;
    beforeEach(async () => {
      user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      firstName = 'new first name';
      lastName = 'new last name';
      orgId = organization.id;
    });
    it('update by globalAdmin should work', async () => {
      const response = await request(app)
        .put(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .send({ firstName, lastName, organization: orgId })
        .expect(200);
      expect(response.body.firstName).toEqual(firstName);
      expect(response.body.lastName).toEqual(lastName);
      user = await User.findOne(user.id, {
        relations: ['roles', 'roles.organization']
      });
      expect(user.roles.length).toEqual(1);
      expect(user.roles[0].organization.id).toEqual(orgId);
      expect(user.roles[0].approved).toEqual(false);
      expect(user.roles[0].role).toEqual('user');
    });
    it('update by globalView should not work', async () => {
      const response = await request(app)
        .put(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({ firstName, lastName, organization: orgId })
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('update by regular user should not work', async () => {
      const response = await request(app)
        .put(`/users/${user.id}`)
        .set('Authorization', createUserToken({}))
        .send({ firstName, lastName, organization: orgId })
        .expect(403);
      expect(response.body).toEqual({});
    });
    it('update by regular user on themselves should work', async () => {
      const response = await request(app)
        .put(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .send({ firstName, lastName, organization: orgId })
        .expect(200);
      expect(response.body.firstName).toEqual(firstName);
      expect(response.body.lastName).toEqual(lastName);
      user = await User.findOne(user.id, {
        relations: ['roles', 'roles.organization']
      });
      expect(user.roles.length).toEqual(1);
      expect(user.roles[0].organization.id).toEqual(orgId);
      expect(user.roles[0].approved).toEqual(false);
      expect(user.roles[0].role).toEqual('user');
    });
  });
});
