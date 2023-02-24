import { handler as notifications} from '../notifications';
import app from '../../../src/api/app';
import * as request from 'supertest';
import { createUserToken } from '../../../test/util';
import { connectToDatabase, Organization, Role, User, UserType } from '../../models';

jest.mock('../s3-client');
const listReports = require('../s3-client').listReports as jest.Mock;

describe ('notifications', () => {
   
    beforeAll(async () => {
        await connectToDatabase();
    });
    test('list all organizations', async () => {
        await Organization.create({
            name: 'WAS-' + Math.random(),
            rootDomains: ['WAS-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();

        await Organization.create({
            name: 'P&E-' + Math.random(),
            rootDomains: ['P&E-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
          
        await Organization.create({
            name: 'VS-' + Math.random(),
            rootDomains: ['VS-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
          
        await notifications(
            notifications,
            {} as any,
            () => void 0
            )
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
    
    /** test('Check if user is Global Admin', async () => {
        const organization = await Organization.create({
            name: 'WAS-' + Math.random(),
            rootDomains: ['WAS-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();

        const firstName = ' first name';
        const lastName = 'last name';
        const email = Math.random() + '@crossfeed.cisa.gov';
        const user = await User.create ({
            firstName,
            lastName,
            email,
            userType: UserType.GLOBAL_ADMIN
        }).save();
        await Role.create({
            role: 'admin',
            approved: false,
            organization,
            user

        }).save();
        
        const response = await request(app)
          .get(`/organizations`)  
          .set(
            'Authorization',
            createUserToken({
              roles: [{org: organization.id, role: 'admin'}],
              userType: UserType.GLOBAL_ADMIN
            })
          )
          .send({currentOrganization: {id: organization.id}})
          .expect(200)
        expect(response)

    }) */
    
    test('getting reports list for all organizations', async () => {
        const organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
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
        expect(listReports).toBeCalledTimes(1);
    
    }) 
});
