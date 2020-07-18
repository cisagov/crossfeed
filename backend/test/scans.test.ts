import * as request from 'supertest';
import app from '../src/api/app';
import { User, Scan, connectToDatabase, Organization } from '../src/models';
import { createUserToken } from './util';

describe('scan', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  describe('list', () => {
    it('list by globalAdmin should return all scans', async () => {
      const name = "test-" + Math.random();
      await Scan.create({
        name,
        arguments: {},
        frequency: 999999,
      }).save();
      await Scan.create({
        name: name + "-2",
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .get('/scans')
        .set('Authorization', createUserToken({
          userType: 'globalAdmin'
        }))
        .expect(200);
      expect(response.body.scans.length).toBeGreaterThanOrEqual(2);
    });
    it('list by globalView should fail', async () => {
      const name = "test-" + Math.random();
      await Scan.create({
        name,
        arguments: {},
        frequency: 999999
      }).save();
      await Scan.create({
        name: name + "-2",
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .get('/scans')
        .set('Authorization', createUserToken({
          userType: 'globalView'
        }))
        .expect(403);
    });
  });
  describe('create', () => {
    it('create by globalAdmin should succeed', async () => {
      const name = "censys";
      const arguments_ = {"a": "b"};
      const frequency = 999999;
      const response = await request(app)
        .post('/scans')
        .set('Authorization', createUserToken({
          userType: 'globalAdmin'
        }))
        .send({
          name,
          arguments: arguments_,
          frequency
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
    });
    it('create by globalView should fail', async () => {
      const name = "censys";
      const arguments_ = {"a": "b"};
      const frequency = 999999;
      const response = await request(app)
        .post('/scans')
        .set('Authorization', createUserToken({
          userType: 'globalView'
        }))
        .send({
          name,
          arguments: arguments_,
          frequency
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('update', () => {
    it('update by globalAdmin should succeed', async () => {
      const scan = await Scan.create({
        name: "censys",
        arguments: {},
        frequency: 999999
      }).save();
      const name = "findomain";
      const arguments_ = {"a": "b2"};
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set('Authorization', createUserToken({
          userType: 'globalAdmin'
        }))
        .send({
          name,
          arguments: arguments_,
          frequency
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
    });
    it('update by globalView should fail', async () => {
      const scan = await Scan.create({
        name: "censys",
        arguments: {},
        frequency: 999999
      }).save();
      const name = "findomain";
      const arguments_ = {"a": "b2"};
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set('Authorization', createUserToken({
          userType: 'globalView'
        }))
        .send({
          name,
          arguments: arguments_,
          frequency
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('delete', () => {
    it('delete by globalAdmin should succeed', async () => {
      const scan = await Scan.create({
        name: "censys",
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .del(`/scans/${scan.id}`)
        .set('Authorization', createUserToken({
          userType: 'globalAdmin'
        }))
        .expect(200);

      expect(response.body.affected).toEqual(1);
    });
    it('delete by globalView should fail', async () => {
      const scan = await Scan.create({
        name: "censys",
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .del(`/scans/${scan.id}`)
        .set('Authorization', createUserToken({
          userType: 'globalView'
        }))
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
});
