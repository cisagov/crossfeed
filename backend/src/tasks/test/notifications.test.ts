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
            name: 'WAS-' + Math.random(),
            rootDomains: ['WAS-' + Math.random()],
            ipBlocks: [],
            isPassive: false

            
          }).save();

        const organization2 = await Organization.create({
            name: 'P&E-' + Math.random(),
            rootDomains: ['P&E-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
          
        const organization3 = await Organization.create({
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
        
    });
  test('getting reports list for all organizations', async () => {

        const organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
          }).save();
        
          
       
    //expect(listReports).toBeCalledTimes(1);
    }) 
});
