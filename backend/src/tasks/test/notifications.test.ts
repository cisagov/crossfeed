import { handler as notifications} from '../notifications';
import app from '../../api/app';
import * as request from 'supertest';
import { connectToDatabase, Organization, Role, User } from '../../models';

jest.mock('../s3-client');
import { createUserToken } from '../../../../backend/test/util';
import { Organizations } from 'aws-sdk';
const listReports = require('../s3-client').listReports as jest.Mock;

describe ('notifications', () => {
    
    beforeAll(async () => {
        await connectToDatabase();
    });
    test('list all organizations', async () => {
        const organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();

        await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
          
        await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
          const response = await request(app)
          .get(`/organizations`)
          .set(
            'Authorization',
            createUserToken({
                roles: [{ org: organization.id, role: 'user' }]
            })
          )
          .expect(200);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        await notifications(

            organization,
            {} as any,
            () => null
            );
    expect(response.body.length).toEqual(1)    
    });
  test('getting reports list for all organizations', async () => {
        const organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
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
    expect(listReports).toBeCalledTimes(1);
    }) 
});
