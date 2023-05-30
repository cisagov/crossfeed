import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Scan,
  connectToDatabase,
  Organization,
  OrganizationTag,
  UserType
} from '../src/models';
import { createUserToken } from './util';
import { handler as scheduler } from '../src/tasks/scheduler';

jest.mock('../src/tasks/scheduler', () => ({
  handler: jest.fn()
}));

describe('scan', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
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
            userType: UserType.GLOBAL_ADMIN
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
    //         userType: UserType.GLOBAL_VIEW
    //       })
    //     )
    //     .expect(403);
    // });
  });
  describe('listGranular', () => {
    it('list by regular user should return all granular, user-modifiable scans', async () => {
      const name = 'test-' + Math.random();
      const scan1 = await Scan.create({
        name,
        arguments: {},
        frequency: 999999,
        isGranular: false,
        isUserModifiable: false,
        isSingleScan: false
      }).save();
      const scan2 = await Scan.create({
        name: name + '-2',
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isUserModifiable: true,
        isSingleScan: false
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
    it('list by regular user should exclude single scans', async () => {
      const name = 'test-' + Math.random();
      const scan1 = await Scan.create({
        name,
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isUserModifiable: true,
        isSingleScan: false
      }).save();
      const scan2 = await Scan.create({
        name: name + '-2',
        arguments: {},
        frequency: 999999,
        isGranular: true,
        isSingleScan: true
      }).save();
      const response = await request(app)
        .get('/granularScans')
        .set('Authorization', createUserToken({}))
        .expect(200);
      expect(response.body.scans.length).toBeGreaterThanOrEqual(1);
      expect(response.body.scans.map((e) => e.id).indexOf(scan2.id)).toEqual(
        -1
      );
    });
  });
  describe('create', () => {
    it('create by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.GLOBAL_ADMIN
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
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: [],
          isUserModifiable: false,
          isSingleScan: false,
          tags: []
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
      expect(response.body.isGranular).toEqual(false);
      expect(response.body.organizations).toEqual([]);
      expect(response.body.tags).toEqual([]);
      expect(response.body.createdBy.id).toEqual(user.id);
    });
    it('create a granular scan by globalAdmin should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.GLOBAL_ADMIN
      }).save();
      const name = 'censys';
      const arguments_ = { a: 'b' };
      const frequency = 999999;
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag]
      }).save();
      const response = await request(app)
        .post('/scans')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: true,
          organizations: [organization.id],
          isUserModifiable: false,
          isSingleScan: false,
          tags: [tag]
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
      expect(response.body.tags[0].id).toEqual(tag.id);
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
            userType: UserType.GLOBAL_VIEW
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: [],
          isUserModifiable: false,
          isSingleScan: false
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
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: false,
          organizations: [],
          isUserModifiable: false,
          isSingleScan: false,
          tags: []
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
        isGranular: false,
        isSingleScan: false
      }).save();
      const tag = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag]
      }).save();
      const name = 'findomain';
      const arguments_ = { a: 'b2' };
      const frequency = 999991;
      const response = await request(app)
        .put(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({
          name,
          arguments: arguments_,
          frequency,
          isGranular: true,
          organizations: [organization.id],
          isSingleScan: false,
          isUserModifiable: true,
          tags: [tag]
        })
        .expect(200);

      expect(response.body.name).toEqual(name);
      expect(response.body.arguments).toEqual(arguments_);
      expect(response.body.frequency).toEqual(frequency);
      expect(response.body.isGranular).toEqual(true);
      expect(response.body.isUserModifiable).toEqual(true);
      expect(response.body.organizations).toEqual([
        {
          id: organization.id
        }
      ]);
      expect(response.body.tags[0].id).toEqual(tag.id);
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
            userType: UserType.GLOBAL_VIEW
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
            userType: UserType.GLOBAL_ADMIN
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
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(403);
      expect(response.body).toEqual({});
    });
  });
  describe('get', () => {
    it('get by globalView should succeed', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .get(`/scans/${scan.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_VIEW
          })
        )
        .expect(200);
      expect(response.body.scan.name).toEqual('censys');
    });

    it('get by regular user on a scan not from their org should fail', async () => {
      const scan = await Scan.create({
        name: 'censys',
        arguments: {},
        frequency: 999999
      }).save();
      const response = await request(app)
        .get(`/scans/${scan.id}`)
        .set('Authorization', createUserToken({}))
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
          userType: UserType.GLOBAL_ADMIN
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
          userType: UserType.GLOBAL_VIEW
        })
      )
      .expect(403);

    expect(response.body).toEqual({});
    expect(scheduler).toHaveBeenCalledTimes(0);
  });
});

describe('run scan', () => {
  it('run scan should manualRunPending to true', async () => {
    const scan = await Scan.create({
      name: 'censys',
      arguments: {},
      frequency: 999999,
      lastRun: new Date()
    }).save();
    const response = await request(app)
      .post(`/scans/${scan.id}/run`)
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_ADMIN
        })
      )
      .expect(200);

    expect(response.body.manualRunPending).toEqual(true);
  });
  it('runScan by globalView should fail', async () => {
    const scan = await Scan.create({
      name: 'censys',
      arguments: {},
      frequency: 999999,
      lastRun: new Date()
    }).save();
    const response = await request(app)
      .post(`/scans/${scan.id}/run`)
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
