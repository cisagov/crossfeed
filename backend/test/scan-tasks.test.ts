import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  ScanTask,
  Scan,
  UserType
} from '../src/models';
import { createUserToken } from './util';
jest.mock('../src/tasks/ecs-client');
const { getLogs } = require('../src/tasks/ecs-client');

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
            userType: UserType.GLOBAL_VIEW
          })
        )
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
            userType: UserType.GLOBAL_VIEW
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
      expect(response.body.result.map((e) => e.id).indexOf(scanTask2.id)).toBe(
        -1
      );
    });
    it('list by regular user should fail', async () => {
      const response = await request(app)
        .post('/scan-tasks/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('kill', () => {
    it('kill by globalAdmin should kill the scantask', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'created'
      }).save();

      const response = await request(app)
        .post(`/scan-tasks/${scanTask.id}/kill`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(200);
      expect(response.body).toEqual({});
    });
    it(`kill by globalAdmin should not work on a finished scantask`, async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished'
      }).save();

      const response = await request(app)
        .post(`/scan-tasks/${scanTask.id}/kill`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .expect(400);
      expect(response.text).toContain('already finished');
    });
    it('kill by globalView should fail', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'created'
      }).save();

      const response = await request(app)
        .post(`/scan-tasks/${scanTask.id}/kill`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('logs', () => {
    it('logs by globalView user should get logs', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        fargateTaskArn: 'fargateTaskArn',
        type: 'fargate',
        status: 'started'
      }).save();

      const response = await request(app)
        .get(`/scan-tasks/${scanTask.id}/logs`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(200)
        .expect('Content-Type', /text\/plain/); // Prevent XSS by setting text/plain header
      expect(response.text).toEqual('logs');
      expect(getLogs).toHaveBeenCalledWith('fargateTaskArn');
    });
    it('logs by regular user should fail', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const scanTask = await ScanTask.create({
        organization,
        scan,
        fargateTaskArn: 'fargateTaskArn',
        type: 'fargate',
        status: 'started'
      }).save();

      const response = await request(app)
        .get(`/scan-tasks/${scanTask.id}/logs`)
        .set('Authorization', createUserToken({}))
        .expect(403);
      expect(response.text).toEqual(
        'Unauthorized access. View logs for details.'
      );
      expect(getLogs).not.toHaveBeenCalled();
    });
  });
});
