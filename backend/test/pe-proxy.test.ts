import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';
import { connectToDatabase, UserType } from '../src/models';

describe('pe-proxy', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  it('standard user is not authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.STANDARD
        })
      )
      .expect(401);
    expect(response.text).toEqual('Unauthorized');
  });
  it('global admin is authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_ADMIN
        })
      );
    // Allow 504. Indicates the user is authorized to
    // proxy to P&E app, but the app is not responding
    expect([200, 504]).toContain(response.status);
  });
  it('global view user is authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_VIEW
        })
      );
    // Allow 504. Indicates the user is authorized to
    // proxy to P&E app, but the app is not responding
    expect([200, 504]).toContain(response.status);
  });
});
