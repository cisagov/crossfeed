import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  Vulnerability,
  Service,
  UserType
} from '../src/models';
import { createUserToken } from './util';

describe('stats', () => {
  let connection;
  const standard = {
    domains: {
      numVulnerabilities: [
        {
          id: expect.any(String),
          label: expect.any(String)
        }
      ]
    },
    vulnerabilities: {
      byOrg: [
        {
          id: expect.any(String),
          label: expect.any(String),
          orgId: expect.any(String)
        }
      ],
      latestVulnerabilities: [
        {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          id: expect.any(String),
          domain: {
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(String),
            name: expect.any(String),
            reverseName: expect.any(String)
          }
        }
      ]
    }
  };
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  describe('get', () => {
    it('get by org user should return only domains from that org', async () => {
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
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Vulnerability.create({
        title: 'vuln title',
        domain,
        cvss: 9,
        severity: 'High'
      }).save();
      await Service.create({
        service: 'http',
        port: 80,
        domain
      }).save();
      await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
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
      expect(response.body.result).toMatchSnapshot(standard);
      expect(response.body.result.domains.numVulnerabilities[0].id).toEqual(
        domain.name + '|Critical'
      );
    });
    it('get by globalView should filter domains to a single org if specified', async () => {
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
      const name = 'test-' + Math.random();
      const domain = await Domain.create({
        name,
        organization
      }).save();
      await Vulnerability.create({
        title: 'vuln title',
        domain,
        cvss: 9,
        severity: 'High'
      }).save();
      await Service.create({
        service: 'http',
        port: 80,
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      await Vulnerability.create({
        title: 'vuln title 2',
        domain: domain2,
        cvss: 1,
        severity: 'Low'
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
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          filters: { organization: organization.id }
        })
        .expect(200);
      expect(response.body.result).toMatchSnapshot(standard);
      expect(response.body.result.domains.numVulnerabilities[0].id).toEqual(
        domain.name + '|Critical'
      );
    });
  });
});
