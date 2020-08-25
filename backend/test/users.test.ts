import * as request from 'supertest';
import app from '../src/api/app';
import { User, connectToDatabase, Organization, Role } from '../src/models';
import { createUserToken, DUMMY_USER_ID } from './util';

const nodemailer = require('nodemailer'); //Doesn't work with import

const sendMailMock = jest.fn();
jest.mock('nodemailer');
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

beforeEach(() => {
  sendMailMock.mockClear();
  nodemailer.createTransport.mockClear();
});

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
      expect(response.body.roles[0].organization.id).toEqual(organization.id);

      const role = (await Role.findOne(response.body.roles[0].id, {
        relations: ['createdBy', 'approvedBy']
      })) as Role;
      expect(role.createdBy.id).toEqual(DUMMY_USER_ID);
      expect(role.approvedBy.id).toEqual(DUMMY_USER_ID);
    });
    it('invite existing user by a different organization admin should work, and should not modify other user details', async () => {
      const firstName = 'first name';
      const lastName = 'last name';
      const email = Math.random() + '@crossfeed.cisa.gov';
      const user = await User.create({
        firstName,
        lastName,
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
          firstName: 'new first name',
          lastName: 'new last name',
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
    it('invite existing user by a different organization admin should work, and should modify user name if user name is initially blank', async () => {
      const email = Math.random() + '@crossfeed.cisa.gov';
      const user = await User.create({
        firstName: '',
        lastName: '',
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
          firstName: 'new first name',
          lastName: 'new last name',
          email,
          organization: organization2.id,
          organizationAdmin: false
        })
        .expect(200);
      expect(response.body.id).toEqual(user.id);
      expect(response.body.email).toEqual(email);
      expect(response.body.invitePending).toEqual(false);
      expect(response.body.firstName).toEqual('new first name');
      expect(response.body.lastName).toEqual('new last name');
      expect(response.body.fullName).toEqual('new first name new last name');
      expect(response.body.roles[1].approved).toEqual(true);
      expect(response.body.roles[1].role).toEqual('user');
    });
    it('invite existing user by same organization admin should work, and should update the user organization role', async () => {
      const adminUser = await User.create({
        firstName: 'first',
        lastName: 'last',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const email = Math.random() + '@crossfeed.cisa.gov';
      const user = await User.create({
        firstName: 'first',
        lastName: 'last',
        email
      }).save();
      await Role.create({
        role: 'user',
        approved: false,
        organization,
        user,
        createdBy: adminUser,
        approvedBy: adminUser
      }).save();
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
          firstName: 'first',
          lastName: 'last',
          email,
          organization: organization.id,
          organizationAdmin: true
        })
        .expect(200);
      expect(response.body.id).toEqual(user.id);
      expect(response.body.email).toEqual(email);
      expect(response.body.invitePending).toEqual(false);
      expect(response.body.firstName).toEqual('first');
      expect(response.body.lastName).toEqual('last');
      expect(response.body.roles[0].approved).toEqual(true);
      expect(response.body.roles[0].role).toEqual('admin');

      const role = (await Role.findOne(response.body.roles[0].id, {
        relations: ['createdBy', 'approvedBy']
      })) as Role;
      expect(role.createdBy.id).toEqual(adminUser.id);
      expect(role.approvedBy.id).toEqual(DUMMY_USER_ID);
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
  describe('meAcceptTerms', () => {
    it('me accept terms by a regular user should accept terms', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov'
      }).save();
      const response = await request(app)
        .post('/users/me/acceptTerms')
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .send({
          version: '1-user'
        })
        .expect(200);
      expect(response.body.email).toEqual(user.email);
      expect(response.body.dateAcceptedTerms).toBeTruthy();
      expect(response.body.acceptedTermsVersion).toEqual('1-user');
    });
    it('accepting terms twice updates user', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z')
      }).save();
      const response = await request(app)
        .post('/users/me/acceptTerms')
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .send({
          version: '2-user'
        })
        .expect(200);
      expect(response.body.email).toEqual(user.email);
      expect(response.body.dateAcceptedTerms).toBeTruthy();
      expect(response.body.acceptedTermsVersion).toEqual('2-user');
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
    it('delete by regular user on themselves should not work', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z')
      }).save();
      const response = await request(app)
        .del(`/users/${user.id}`)
        .set(
          'Authorization',
          createUserToken({
            id: user.id
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('update', () => {
    let user, firstName, lastName, orgId;
    beforeEach(async () => {
      user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z')
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
        relations: ['roles', 'roles.organization', 'roles.createdBy']
      });
      expect(user.roles.length).toEqual(1);
      expect(user.roles[0].organization.id).toEqual(orgId);
      expect(user.roles[0].approved).toEqual(false);
      expect(user.roles[0].role).toEqual('user');
      expect(user.roles[0].createdBy.id).toEqual(user.id);
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
