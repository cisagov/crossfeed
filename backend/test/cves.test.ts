import * as request from 'supertest';
import app from '../src/api/app';
import { Cve, Organization, connectToDatabase } from '../src/models';
import { createUserToken } from './util';

describe('cves', () => {
  let connection;
  let cve: Cve;
  let organization: Organization;
  beforeAll(async () => {
    connection = await connectToDatabase();
    cve = Cve.create({
      cve_uid: '00000000-0000-0000-0000-000000000000',
      cve_name: 'CVE-0001-0001'
    });
    await cve.save();
    organization = Organization.create({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    });
    await organization.save();
  });

  afterAll(async () => {
    await Cve.delete(cve.cve_uid);
    await Organization.delete(organization.id);
    await connection.close();
  });
  describe('CVE API', () => {
    it('should return a single CVE by cve_name', async () => {
      const response = await request(app)
        .get(`/cves/${cve.cve_name}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body).toHaveProperty('cve');
      expect(response.body.cve.cve_name).toEqual(cve.cve_name);
    });
  });
});
