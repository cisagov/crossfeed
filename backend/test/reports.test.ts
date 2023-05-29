import * as request from 'supertest';
import app from '../src/api/app';
import { connectToDatabase, Organization, Role, User } from '../src/models';
import { createUserToken } from './util';

jest.mock('../src/tasks/s3-client');
const listReports = require('../src/tasks/s3-client').listReports as jest.Mock;
const exportReport = require('../src/tasks/s3-client')
  .exportReport as jest.Mock;

describe('reports', () => {
  let organization;
  let organization2;
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    organization2 = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  afterAll(async () => {
    await connection.close();
  });
  it('calling reports list should not work for a user outside of the org', async () => {
    const firstName = 'first name';
    const lastName = 'last name';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();
    const response = await request(app)
      .post('/reports/list')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization2.id, role: 'user' }]
        })
      )
      .send({ currentOrganization: { id: organization.id } })
      .expect(404);
    expect(response.text).toEqual('User is not a member of this organization.');
    expect(listReports).toBeCalledTimes(0);
  });
  it('calling reports list should work for a user inside of the org', async () => {
    const firstName = 'first name';
    const lastName = 'last name';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();
    const response = await request(app)
      .post('/reports/list')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization.id, role: 'user' }]
        })
      )
      .send({ currentOrganization: { id: organization.id } })
      .expect(200);
    expect(response.text).toEqual('{"Contents":"report content"}');
    expect(listReports).toBeCalledTimes(1);
  });
  it('calling report export should not work for a user outside of the org', async () => {
    const firstName = 'first name';
    const lastName = 'last name';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();
    const response = await request(app)
      .post('/reports/export')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization2.id, role: 'user' }]
        })
      )
      .send({ currentOrganization: { id: organization.id } })
      .expect(404);
    expect(response.text).toEqual('User is not a member of this organization.');
    expect(exportReport).toBeCalledTimes(0);
  });
  it('calling report export should work for a user inside of the org', async () => {
    const firstName = 'first name';
    const lastName = 'last name';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();
    const response = await request(app)
      .post('/reports/export')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization.id, role: 'user' }]
        })
      )
      .send({ currentOrganization: { id: organization.id } })
      .expect(200);
    expect(response.text).toEqual('{"url":"report_url"}');
    expect(exportReport).toBeCalledTimes(1);
  });
});
