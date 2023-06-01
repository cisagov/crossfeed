import { handler as notifications } from '../notifications';
import app from '../../../src/api/app';
import * as request from 'supertest';
import { createUserToken } from '../../../test/util';
import {
  connectToDatabase,
  Organization,
  Role,
  User,
  UserType
} from '../../models';

jest.mock('../s3-client');
const listReports = require('../s3-client').listReports as jest.Mock;
const sendReportEmail = require('nodemailer').sendReportEmail as jest.Mock;

const nodemailer = require('nodemailer');

const sendMailMock = jest.fn();
jest.mock('nodemailer');
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

beforeEach(() => {
  sendMailMock.mockClear();
  nodemailer.createTransport.mockClear();
});

describe('notifications', () => {
  let organization;
  let organization2;
  let organization3;
  beforeAll(async () => {
    await connectToDatabase();
    organization = await Organization.create({
      name: 'CISA',
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

    organization3 = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
  });
  test('list all organizations', async () => {
    const response = await request(app)
      .get(`/organizations`)
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_ADMIN
        })
      )
      .expect(200);
    await notifications(
      {
        organizations: organization,
        organization2,
        organization3
      },
      {} as any,
      () => void 0
    );
    expect(response.body.length).toBeGreaterThan(2);
  });

  test('Notification emails should not send to non-admins', async () => {
    const firstName = 'first names';
    const lastName = 'last names';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();

    const response = await request(app)
      .post('/users')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization.id, role: 'user' }]
        })
      )
      .send({
        firstName,
        lastName,
        email,
        organization: organization.id
      })
      .expect(403);
  });
  test('Notification emails should send to admins', async () => {
    const firstName = 'first names';
    const lastName = 'last names';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName,
      lastName,
      email
    }).save();

    const response = await request(app)
      .post('/users')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization.id, role: 'admin' }]
        })
      )
      .send({
        firstName,
        lastName,
        email,
        organization: organization.id
      })
      .expect(200);
    //console.log(response.body)
    expect(response.body.email).toEqual(email);
    expect(response.body.firstName).toEqual(firstName);
    expect(response.body.lastName).toEqual(lastName);
    expect(response.body.roles[0].approved).toEqual(true);
    expect(response.body.roles[0].role).toEqual('admin');
    expect(response.body.roles[0].organization.id).toEqual(organization.id);
    expect(sendReportEmail).toBeCalled;
  });
});
