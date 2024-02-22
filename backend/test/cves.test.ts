import * as request from 'supertest';
import app from '../src/api/app';
import { Cve, Organization, connectToDatabase } from '../src/models';
import { createUserToken } from './util';

// TODO: Add test for joining cpes and implement data from sample_data/cpes.json
describe('cves', () => {
  let connection;
  let cve: Cve;
  let organization: Organization;
  beforeAll(async () => {
    connection = await connectToDatabase();
    cve = Cve.create({
      name: 'CVE-0001-0001'
    });
    await cve.save();
    organization = Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    });
    await organization.save();
  });

  afterAll(async () => {
    await Cve.delete(cve.id);
    await Organization.delete(organization.id);
    await connection.close();
  });
  describe('CVE API', () => {
    it('should return a single CVE by name', async () => {
      const response = await request(app)
        .get(`/cves/name/${cve.name}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.id).toEqual(cve.id);
      expect(response.body.name).toEqual(cve.name);
    });
  });
  describe('CVE API', () => {
    it('should return a single CVE by id', async () => {
      const response = await request(app)
        .get(`/cves/${cve.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.id).toEqual(cve.id);
      expect(response.body.name).toEqual(cve.name);
    });
  });
});
