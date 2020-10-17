import * as request from 'supertest';
import app from '../src/api/app';
import { User, Domain, connectToDatabase, Organization } from '../src/models';
import { createUserToken } from './util';

import '../src/tasks/es-client';

jest.mock('../src/tasks/es-client');
const searchDomains = require('../src/tasks/es-client')
  .searchDomains as jest.Mock;
jest.mock('../src/api/search/buildRequest');
const buildRequest = require('../src/api/search/buildRequest')
  .buildRequest as jest.Mock;

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
        .send({
          current: 1,
          resultsPerPage: 25,
          searchTerm: 'term',
          sortDirection: 'asc',
          sortField: 'name',
          filters: []
        })
        .expect(200);
      expect(buildRequest.mock.calls[0][1]).toEqual({
        matchAllOrganizations: true,
        organizationIds: []
      });
      expect(response.body).toEqual([1, 2, 3]);
    });
    it('search by regular user should work', async () => {
      const response = await request(app)
        .post('/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({
          current: 1,
          resultsPerPage: 25,
          searchTerm: 'term',
          sortDirection: 'asc',
          sortField: 'name',
          filters: []
        })
        .expect(200);
      expect(buildRequest.mock.calls[0][1]).toEqual({
        matchAllOrganizations: false,
        organizationIds: [organization.id]
      });
    });
  });
});

describe('buildRequest', () => {
  const buildRequest = jest.requireActual('../src/api/search/buildRequest').buildRequest;
  test('sample request by global admin', () => {
    const req = buildRequest({
      current: 1,
      resultsPerPage: 25,
      searchTerm: 'term',
      sortDirection: 'asc',
      sortField: 'name',
      filters: []
    }, { matchAllOrganizations: true, organizationIds: [] });
    expect(req).toMatchSnapshot();
  });
  test('sample request by non-global admin', () => {
    const req = buildRequest({
      current: 1,
      resultsPerPage: 25,
      searchTerm: 'term',
      sortDirection: 'asc',
      sortField: 'name',
      filters: []
    }, { matchAllOrganizations: false, organizationIds: ["id1"] });
    expect(req).toMatchSnapshot();
  });
})