import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  UserType
} from '../src/models';
import { createUserToken } from './util';
import '../src/tasks/es-client';

jest.mock('../src/tasks/es-client');
const searchDomains = require('../src/tasks/es-client')
  .searchDomains as jest.Mock;
jest.mock('../src/api/search/buildRequest');
const buildRequest = require('../src/api/search/buildRequest')
  .buildRequest as jest.Mock;

jest.mock('../src/tasks/s3-client');
const saveCSV = require('../src/tasks/s3-client').saveCSV as jest.Mock;

const body = {
  hits: {
    hits: [
      {
        _source: {
          name: 'test',
          ip: 'test',
          organization: {
            name: 'test'
          },
          services: [
            {
              port: 443,
              products: []
            }
          ]
        }
      },
      {
        _source: {
          name: 'test2',
          ip: 'test',
          organization: {
            name: 'test'
          },
          services: [
            {
              port: 443,
              products: []
            }
          ]
        }
      }
    ]
  }
};

describe('search', () => {
  let organization;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  afterAll(async () => {
    await connection.close();
  });
  beforeEach(async () => {
    searchDomains
      .mockImplementationOnce(() => {
        return { body };
      })
      .mockImplementationOnce(() => {
        return {
          body: {
            hits: {
              hits: []
            }
          }
        };
      });
  });
  describe('search', () => {
    it('search by global admin should work', async () => {
      const response = await request(app)
        .post('/search')
        .set(
          'Authorization',
          createUserToken({
            userType: UserType.GLOBAL_ADMIN
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
      expect(response.body).toEqual(body);
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

    it('export by regular user should work', async () => {
      const response = await request(app)
        .post('/search/export')
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
      expect(response.body).toEqual({ url: 'http://mock_url' });
      expect(saveCSV).toBeCalledTimes(1);
      expect(saveCSV.mock.calls[0][0]).toContain('test');
    });
  });
});

describe('buildRequest', () => {
  const buildRequest = jest.requireActual(
    '../src/api/search/buildRequest'
  ).buildRequest;
  test('sample request by global admin', () => {
    const req = buildRequest(
      {
        current: 1,
        resultsPerPage: 25,
        searchTerm: 'term',
        sortDirection: 'asc',
        sortField: 'name',
        filters: []
      },
      { matchAllOrganizations: true, organizationIds: [] }
    );
    expect(req).toMatchSnapshot();
  });
  test('sample request by non-global admin', () => {
    const req = buildRequest(
      {
        current: 1,
        resultsPerPage: 25,
        searchTerm: 'term',
        sortDirection: 'asc',
        sortField: 'name',
        filters: []
      },
      { matchAllOrganizations: false, organizationIds: ['id1'] }
    );
    expect(req).toMatchSnapshot();
  });
});
