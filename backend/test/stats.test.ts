import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  Vulnerability,
  Service
} from '../src/models';
import { createUserToken } from './util';

describe('stats', () => {
  let organization;
  beforeAll(async () => {
    await connectToDatabase();
  });
  describe('get', () => {
    it('get by org user should return only domains from that org', async () => {
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
      await Vulnerability.create({
        title: 'vuln title',
        domain,
        cvss: 9
      }).save();
      await Service.create({
        service: 'http',
        port: 80,
        domain
      }).save();
      await Domain.create({
        name: 'test-' + Math.random()
      }).save();
      const response = await request(app)
        .post('/stats')
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
      expect(response.body.result).toMatchSnapshot({
        domains: {
          numVulnerabilities: [
            {
              id: expect.any(String),
              label: expect.any(String)
            }
          ]
        }
      });
      expect(response.body.result.domains.numVulnerabilities[0].id).toEqual(
        domain.name
      );
    });
    it('get by globalView should filter domains to a single org if specified', async () => {
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
      await Vulnerability.create({
        title: 'vuln title',
        domain,
        cvss: 9
      }).save();
      await Service.create({
        service: 'http',
        port: 80,
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random()
      }).save();
      await Vulnerability.create({
        title: 'vuln title 2',
        domain: domain2,
        cvss: 1
      }).save();
      await Service.create({
        service: 'https',
        port: 443,
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/stats')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          filters: { organization: organization.id }
        })
        .expect(200);
      expect(response.body.result).toMatchSnapshot({
        domains: {
          numVulnerabilities: [
            {
              id: expect.any(String),
              label: expect.any(String)
            }
          ]
        }
      });
      expect(response.body.result.domains.numVulnerabilities[0].id).toEqual(
        domain.name
      );
    });
  });
});
