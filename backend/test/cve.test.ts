import * as request from 'supertest';
import app from '../src/api/app';
import { Cve, Organization, connectToDatabase } from '../src/models';
import { createUserToken } from './util';

describe('cve', () => {
  let connection;
  let cve: Cve;
  let organization: Organization;
  beforeAll(async () => {
    connection = await connectToDatabase();
    cve = Cve.create({
      cve_name: 'CVE-0001-0001'
    });
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });

  afterAll(async () => {
    await Cve.delete(cve);
    await Organization.delete(organization.id);
    await connection.close();
  });
  describe('CVE API', () => {
    it('should return a single CVE by cve_name', async () => {
      const res = await request(app)
        .get(`/api/cve/${cve.cve_name}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('cve');
      expect(res.body.cve.cve_name).toEqual(cve.cve_name);
    });
  });
});
