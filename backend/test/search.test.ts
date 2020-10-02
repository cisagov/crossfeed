import * as request from 'supertest';
import app from '../src/api/app';
import { User, Domain, connectToDatabase, Organization } from '../src/models';
import { createUserToken } from './util';

import '../src/tasks/es-client';

jest.mock('../src/tasks/es-client');
const { searchDomains } = require('../src/tasks/es-client');

describe('search', () => {
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
  describe('search', () => {
    it('search by global admin should work', async () => {
      searchDomains.mockImplementation(() => ({
        body: [1, 2, 3]
      }));
      const response = await request(app)
        .post('/search')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalAdmin'
          })
        )
        .send({})
        .expect(200);
      expect(response.body).toEqual([1, 2, 3]);
    });

    it('search by non-global admin should not work', async () => {
      const response = await request(app)
        .post('/search')
        .set(
          'Authorization',
          createUserToken({
            roles: []
          })
        )
        .send({})
        .expect(403);
    });
  });
});
