import { handler as notifications} from '../notifications';
import app from '../../../src/api/app';
import * as request from 'supertest';
import { createUserToken } from '../../../test/util';
import { connectToDatabase, Organization, Role, User, UserType } from '../../models';

jest.mock('../s3-client');
const listReports = require('../s3-client').listReports as jest.Mock;

describe ('notifications', () => {
   let organization;
   let organization2;
   let organization3;
    beforeAll(async () => {
        await connectToDatabase();
        organization = await Organization.create({
          name: 'WAS-' + Math.random(),
          rootDomains: ['WAS-' + Math.random()],
          ipBlocks: [],
          isPassive: false
        }).save();
       
        organization2 = await Organization.create({
          name: 'P&E-' + Math.random(),
          rootDomains: ['P&E-' + Math.random()],
          ipBlocks: [],
          isPassive: false
        }).save();
        
        organization3 = await Organization.create({
          name: 'VS-' + Math.random(),
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
    
     test('Get all org admins only', async () => {
        
        const user = await User.create ({
            firstName: 'Deku',
            lastName: '',
            email: Math.random() + '@crossfeed.cisa.gov',
            
        }).save();
        const user2 = await User.create ({
          firstName: 'Kacchan',
          lastName: '',
          email: Math.random() + '@crossfeed.cisa.gov',
      }).save();
      const user3 = await User.create ({
        firstName: 'Todoroki',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
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
        role: 'admin',
        approved: false,
        organization: organization3,
        user: user3,
    }).save();

        
        const response = await request(app)
          .get(`/organizations`)  
          .set(
            'Authorization',
            createUserToken({
              roles: [{org: organization.id, role: 'admin'}],
              
            })
          )
          .send({currentOrganization: {id: organization.id}})
          .expect(200)
        expect(response)

    }) 
    
    test('getting reports list for all organizations', async () => {
      const user = await User.create ({
        firstName: 'Dabi',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov', 
    }).save();
    await Role.create({
      role: 'user',
      approved: false,
      organization,
      user
    }).save();
        await notifications(
          {},
          {} as any,
          () => void 0
          )

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
    
    }) 
});
