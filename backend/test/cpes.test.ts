import * as request from 'supertest';
import app from '../src/api/app';
import { Organization, ProductInfo, connectToDatabase } from '../src/models';
import { createUserToken } from './util';

describe('cpes', () => {
  let connection;
  let organization: Organization;
  let productInfo: ProductInfo;
  beforeAll(async () => {
    connection = await connectToDatabase();
    productInfo = ProductInfo.create({
      last_seen: new Date(),
      cpe_product_name: 'Test Product',
      version_number: '1.0.0',
      vender: 'Test Vender'
    });
    await productInfo.save();
    organization = Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    });
    await organization.save();
  });

  afterAll(async () => {
    await ProductInfo.delete(productInfo.id);
    await connection.close();
  });

  describe('CPE API', () => {
    it('should return a single CPE by id', async () => {
      const response = await request(app)
        .get(`/cpes/${productInfo.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.id).toEqual(productInfo.id);
      expect(response.body.cpe_product_name).toEqual(
        productInfo.cpe_product_name
      );
    });
  });
});
