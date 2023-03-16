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
      name: 'Web Application Scanning-' + Math.random(),
      rootDomains: ['WAS-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();

    organization2 = await Organization.create({
      name: 'Posture & Exposure-' + Math.random(),
      rootDomains: ['P&E-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();

    organization3 = await Organization.create({
      name: 'Vulnerability Scanning-' + Math.random(),
      rootDomains: ['VS-' + Math.random()],
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
    expect(response.body.length).toBe(3);
  });

  test('Get org admins ', async () => {
    const firstName = 'first names';
    const lastName = 'last names';
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName: 'Deku',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov'
    }).save();
    const user2 = await User.create({
      firstName: 'Kacchan',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov'
    }).save();
    const user3 = await User.create({
      firstName: 'Todoroki',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov'
    }).save();
    await Role.create({
      role: 'admin',
      approved: false,
      organization: organization,
      user: user
    }).save();
    await Role.create({
      role: 'admin',
      approved: false,
      organization: organization2,
      user: user2
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization: organization3,
      user: user3
    }).save();

    const response = await request(app)
      .post(`/users`)
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
        organization: organization.id,
        organizationAdmin: true})
      .expect(200);
      console.log(response.body)
      expect(response.body.roles[0].role).toEqual('admin'); // this may be key
    });

  test('getting reports list for all organizations', async () => {
    const user = await User.create({
      firstName: 'Dabi',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov'
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();

    const response = await request(app)
      .get('/reports/list')
      .set(
        'Authorization',
        createUserToken({
          roles: [{ org: organization.id, role: 'user' }]
        })
      )
      .send({ currentOrganization: { id: organization.id } })
      .expect(200);
    expect(response.text).toEqual('{"Contents":"report content"}');
    expect(listReports).toBeCalled;
  });
  test('Emails to regular user should not send', async () => {
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
        organization: organization.id,
        organizationAdmin: false
      })
      .expect(403);
  });
  test('Emails to org admin user should send', async () => {
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
        organization: organization.id,
        organizationAdmin: true
      })
      .expect(200);
    //console.log(response.body)
    expect(response.body.email).toEqual(email);
    expect(response.body.firstName).toEqual(firstName);
    expect(response.body.lastName).toEqual(lastName);
    expect(response.body.roles[0].approved).toEqual(true);
    expect(response.body.roles[0].role).toEqual('admin');
    expect(response.body.roles[0].organization.id).toEqual(organization.id);
  });
});
