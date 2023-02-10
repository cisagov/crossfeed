import { handler as notifications} from '../notifications';
import app from '../../api/app';
import * as request from 'supertest';
import { connectToDatabase, Organization, OrganizationTag } from '../../models';

jest.mock('../s3-client');
import { createUserToken } from '../../../../backend/test/util';
const latestReports = require('../s3-client').listReports as jest.Mock;

describe ('notifications', () => {
    let organization;
    beforeAll(async () => {
        await connectToDatabase();
    });
    test('should return the list of reports', async () => {
        const response = await request(app)
        .get('/reports/list')
        .set(
          'Authorization',
          createUserToken({
            roles: [{ org: organization.id, role: 'user' }]
          })
        )
        .send({ currentOrganization: { id: organization.id } })
        
        expect(latestReports).toReturn;
    })
})
