import * as request from 'supertest';
import app from '../src/api/app';
import { User, Domain, connectToDatabase, Organization } from '../src/models';
import { createUserToken } from './util';

describe('domains', () => {
  let organization;
  beforeAll(async () => {
    await connectToDatabase();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  describe('list', () => {
    it('list by org user should return only domains from that org', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2'
      }).save();
      const response = await request(app)
        .post('/domain/search')
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
          filters: { reverseName: name }
        })
        .expect(200);
      expect(response.body.count).toEqual(1);
    });
    it('list by globalView should return domains from all orgs', async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2'
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
    });
    it("list by org user that hasn't signed the terms should fail", async () => {
      const name = 'test-' + Math.random();
      await Domain.create({
        name,
        organization
      }).save();
      await Domain.create({
        name: name + '-2'
      }).save();
      const response = await request(app)
        .post('/domain/search')
        .set(
          'Authorization',
          createUserToken({
            dateAcceptedTerms: undefined,
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .send({
          filters: { reverseName: name }
        })
        .expect(403);
      expect(response.text).toContain('must accept terms');
    });
  });
  describe('get', () => {
    it("get by org user should work for domain in the user's org", async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
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
      expect(response.body.id).toEqual(domain.id);
    });
    it("get by org user should not work for domain not in the user's org", async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
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
        .expect(404);
      expect(response.body).toEqual({});
    });
    it('get by globalView should work for any domain', async () => {
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name
      }).save();
      const response = await request(app)
        .get(`/domain/${domain.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(domain.id);
    });
  });
});
