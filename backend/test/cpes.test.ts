import * as request from 'supertest';
import app from '../src/api/app';
import { Organization, Cpe, connectToDatabase } from '../src/models';
import { createUserToken } from './util';

describe('cpes', () => {
  let connection;
  let organization: Organization;
  let cpe: Cpe;
  beforeAll(async () => {
    connection = await connectToDatabase();
    cpe = Cpe.create({
      lastSeenAt: new Date(),
      name: 'Test Product',
      version: '1.0.0',
      vendor: 'Test Vender'
    });
    await cpe.save();
    organization = Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    });
    await organization.save();
  });

  afterAll(async () => {
    await Cpe.delete(cpe.id);
    await connection.close();
  });

  describe('CPE API', () => {
    it('should return a single CPE by id', async () => {
      const response = await request(app)
        .get(`/cpes/${cpe.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.id).toEqual(cpe.id);
      expect(response.body.name).toEqual(cpe.name);
    });
  });
});
