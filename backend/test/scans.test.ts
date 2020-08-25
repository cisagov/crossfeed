import * as request from 'supertest';
import app from '../src/api/app';
import { User, Scan, connectToDatabase, Organization } from '../src/models';
import { createUserToken } from './util';
import { handler as scheduler } from '../src/tasks/scheduler';

jest.mock('../src/tasks/scheduler', () => ({
  handler: jest.fn()
}));

describe('scan', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  describe('list', () => {
    it('list by globalAdmin should return all scans', async () => {
      const name = 'test-' + Math.random();
      await Scan.create({
        name,
        arguments: {},
        frequency: 999999
      }).save();
      await Scan.create({
        name: name + '-2',
        arguments: {},
        frequency: 999999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .get('/scans')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .expect(200);
      expect(response.body.scans.length).toBeGreaterThanOrEqual(2);
      expect(response.body.organizations.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.organizations.map((e) => e.id).indexOf(organization.id)
      ).toBeGreaterThan(-1);
    });
    // it('list by globalView should fail', async () => {
    //   const name = 'test-' + Math.random();
    //   await Scan.create({
    //     name,
    //     arguments: {},
    //     frequency: 999999
    //   }).save();
    //   await Scan.create({
    //     name: name + '-2',
    //     arguments: {},
    //     frequency: 999999
    //   }).save();
    //   const response = await request(app)
    //     .get('/scans')
    //     .set(
    //       'Authorization',
    //       createUserToken({
    //         userType: 'globalView'
    //       })
    //     )
    //     .expect(403);
    // });
  });
  describe('listGranular', () => {
    it('list by regular user should return all granular scans', async () => {
      const name = 'test-' + Math.random();
      const scan1 = await Scan.create({
        name,
        arguments: {},
        frequency: 999999,
        isGranular: false
      }).save();
      const scan2 = await Scan.create({
        name: name + '-2',
        arguments: {},
        frequency: 999999,
        isGranular: true
      }).save();
      const response = await request(app)
        .get('/granularScans')
        .set('Authorization', createUserToken({}))
        .expect(200);
      expect(response.body.scans.length).toBeGreaterThanOrEqual(1);
      expect(response.body.scans.map((e) => e.id).indexOf(scan1.id)).toEqual(
        -1
      );
      expect(
        response.body.scans.map((e) => e.id).indexOf(scan2.id)
      ).toBeGreaterThanOrEqual(-1);
    });
  });
  describe('create', () => {
    it('create by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: 'globalAdmin'
      }).save();
      const name = 'censys';
      const arguments_ = { a: 'b' };
      const frequency = 999999;
      const response = await request(app)
        .post('/scans')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: 'globalAdmin'
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: []
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
      expect(response.body.isGranular).toEqual(false);
      expect(response.body.organizations).toEqual([]);
      expect(response.body.createdBy.id).toEqual(user.id);
    });
    it('create a granular scan by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: 'globalAdmin'
      }).save();
      const name = 'censys';
      const arguments_ = { a: 'b' };
      const frequency = 999999;
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const response = await request(app)
        .post('/scans')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: 'globalAdmin'
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: true,
          organizations: [organization.id]
        })
        .expect(200);
      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
      expect(response.body.isGranular).toEqual(true);
      expect(response.body.organizations).toEqual([
        {
          id: organization.id
        }
      ]);
    });
    it('create by globalView should fail', async () => {
      const name = 'censys';
      const arguments_ = { a: 'b' };
      const frequency = 999999;
      const response = await request(app)
        .post('/scans')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: []
        })
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('update', () => {
    it('update by globalAdmin should succeed', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const name = 'findomain';
      const arguments_ = { a: 'b2' };
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: []
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
    });
    it('update a non-granular scan to a granular scan by globalAdmin should succeed', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999,
        isGranular: false
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const name = 'findomain';
      const arguments_ = { a: 'b2' };
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: true,
          organizations: [organization.id]
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
      expect(response.body.isGranular).toEqual(true);
      expect(response.body.organizations).toEqual([
        {
          id: organization.id
        }
      ]);
    });
    it('update by globalView should fail', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const name = 'findomain';
      const arguments_ = { a: 'b2' };
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
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
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .del(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .expect(200);

      expect(response.body.affected).toEqual(1);
    });
    it('delete by globalView should fail', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .del(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
});

describe('scheduler invoke', () => {
  it('invoke by globalAdmin should succeed', async () => {
    const response = await request(app)
      .post(`/scheduler/invoke`)
      .set(
        'Authorization',
        createUserToken({
          userType: 'globalAdmin'
        })
      )
      .expect(200);

    expect(response.body).toEqual({});
    expect(scheduler).toHaveBeenCalledTimes(1);
  });
  it('invoke by globalView should fail', async () => {
    const response = await request(app)
      .post(`/scheduler/invoke`)
      .set(
        'Authorization',
        createUserToken({
          userType: 'globalView'
        })
      )
      .expect(403);

    expect(response.body).toEqual({});
    expect(scheduler).toHaveBeenCalledTimes(0);
  });
});
