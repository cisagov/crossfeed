import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken, DUMMY_USER_ID } from './util';
import {
  Organization,
  Role,
  connectToDatabase,
  Scan,
  ScanTask,
  User,
  SavedSearch,
  UserType
} from '../src/models';

describe('saved-search', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  describe('create', () => {
    it('create by user should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const name = 'test-' + Math.random();
      const response = await request(app)
        .post('/saved-searches/')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({
          name,
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        })
        .expect(200);
      expect(response.body).toMatchSnapshot({
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: expect.any(String),
        name: expect.any(String),
        createdBy: {
          id: expect.any(String)
        }
      });
      expect(response.body.createdBy.id).toEqual(user.id);
      expect(response.body.name).toEqual(name);
    });
    describe('update', () => {
      it('update by globalAdmin should fail', async () => {
        const body = {
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        };
        const search = await SavedSearch.create(body).save();
        body.name = 'test-' + Math.random();
        body.searchTerm = '123';
        body.createVulnerabilities = true;
        const response = await request(app)
          .put(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_ADMIN
            })
          )
          .send(body)
          .expect(404);
      });
      it('update by standard user with access should succeed', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const body = {
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        };
        const search = await SavedSearch.create({
          ...body,
          createdBy: user
        }).save();
        body.name = 'test-' + Math.random();
        body.searchTerm = '123';
        body.createVulnerabilities = true;
        const response = await request(app)
          .put(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.STANDARD,
              id: user.id
            })
          )
          .send(body)
          .expect(200);
        expect(response.body.name).toEqual(body.name);
        expect(response.body.searchTerm).toEqual(body.searchTerm);
        expect(response.body.createVulnerabilities).toEqual(
          body.createVulnerabilities
        );
      });
      it('update by standard user without access should fail', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const user1 = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const body = {
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        };
        const search = await SavedSearch.create(body).save();
        const response = await request(app)
          .put(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.STANDARD,
              id: user1.id
            })
          )
          .send(body)
          .expect(404);
        expect(response.body).toEqual({});
      });
      it('update by globalView should fail', async () => {
        const body = {
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        };
        const search = await SavedSearch.create(body).save();
        const response = await request(app)
          .put(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_VIEW
            })
          )
          .send(body)
          .expect(404);
        expect(response.body).toEqual({});
      });
    });
    describe('delete', () => {
      it('delete by globalAdmin should fail', async () => {
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        }).save();
        const response = await request(app)
          .delete(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_ADMIN
            })
          )
          .expect(404);
      });
      it('delete by user with access should succeed', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        }).save();
        const response = await request(app)
          .delete(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.STANDARD,
              id: user.id
            })
          )
          .expect(200);
        expect(response.body.affected).toEqual(1);
      });
      it('delete by user without access should fail', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const user1 = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        }).save();
        const response = await request(app)
          .delete(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.STANDARD,
              id: user1.id
            })
          )
          .expect(404);
        expect(response.body).toEqual({});
      });
      it('delete by globalView should fail', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const user1 = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        }).save();
        const response = await request(app)
          .delete(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_VIEW,
              id: user1.id
            })
          )
          .expect(404);
        expect(response.body).toEqual({});
      });
    });
    describe('list', () => {
      it('list by globalView should return none', async () => {
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        }).save();
        const response = await request(app)
          .get(`/saved-searches`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_VIEW
            })
          )
          .expect(200);
        expect(response.body.count).toEqual(0);
      });
      it('list by user should only get their search', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const user1 = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        }).save();
        // this org should not show up in the response
        const search2 = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user1
        }).save();
        const response = await request(app)
          .get(`/saved-searches`)
          .set(
            'Authorization',
            createUserToken({
              id: user.id,
              userType: UserType.STANDARD
            })
          )
          .expect(200);
        expect(response.body.count).toEqual(1);
        expect(response.body.result[0].id).toEqual(search.id);
      });
    });
    describe('get', () => {
      it('get by globalView should fail', async () => {
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {}
        }).save();
        const response = await request(app)
          .get(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              userType: UserType.GLOBAL_VIEW
            })
          )
          .expect(404);
      });
      it('get by a user should pass', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user
        }).save();
        const response = await request(app)
          .get(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              id: user.id,
              userType: UserType.STANDARD
            })
          )
          .expect(200);
        expect(response.body.name).toEqual(search.name);
      });
      it('get by a different user should fail', async () => {
        const user = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const user1 = await User.create({
          firstName: '',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
          userType: UserType.STANDARD
        }).save();
        const search = await SavedSearch.create({
          name: 'test-' + Math.random(),
          count: 3,
          sortDirection: '',
          sortField: '',
          searchTerm: '',
          searchPath: '',
          filters: [],
          createVulnerabilities: false,
          vulnerabilityTemplate: {},
          createdBy: user1
        }).save();
        const response = await request(app)
          .get(`/saved-searches/${search.id}`)
          .set(
            'Authorization',
            createUserToken({
              id: user.id,
              userType: UserType.STANDARD
            })
          )
          .expect(404);
        expect(response.body).toEqual({});
      });
    });
  });
});
