import { handler as notifications} from '../notifications';
import app from '../../api/app';
import * as request from 'supertest';
import { connectToDatabase, Organization, Role, User } from '../../models';

jest.mock('../s3-client');
import { createUserToken } from '../../../../backend/test/util';
const latestReports = require('../s3-client').listReports as jest.Mock;

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
        
          
        const response = await request(app)
            .get('/organizations')
            .set(
              'Authorization',
             createUserToken({
               roles: [{ org: organization.id, role: 'user' }]
             })
            )
            .send({ currentOrganization: { id: organization.id} })
            .expect(200);
            
            await notifications(
                [organization.id],
                {} as any,
                () => void 0
    
              );

    });
    test('calling reports list for all organizations', async () => {
        const organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
    })
});
