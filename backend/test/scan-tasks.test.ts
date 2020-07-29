import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  ScanTask,
  Scan
} from '../src/models';
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
    it('list by globalView should return scan tasks', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'failed'
      }).save();

      const response = await request(app)
        .post('/scan-tasks/search')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        );
      .expect(200);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.result.map((e) => e.id).indexOf(scanTask.id)
      ).toBeGreaterThan(-1);
    });
    it('list by globalView with filter should return filtered scan tasks', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'failed'
      }).save();

      const scan2 = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask2 = await ScanTask.create({
        organization,
        scan: scan2,
        type: 'fargate',
        status: 'failed'
      }).save();

      const response = await request(app)
        .post('/scan-tasks/search')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          filters: { name: 'findomain' }
        })
        .expect(200);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.result.map((e) => e.id).indexOf(scanTask.id)
      ).toBeGreaterThan(-1);
      expect(
        response.body.result.map((e) => e.id).indexOf(scanTask2.id)
      ).toBe(-1);
    });
    it('list by regular user should be unauthorized', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();

      const response = await request(app)
        .post('/scan-tasks/search')
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
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
});
