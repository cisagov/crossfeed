import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';
import { connectToDatabase, UserType } from '../src/models';

describe('pe-proxy', () => {
  beforeAll(async () => {
    await connectToDatabase();
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
  it('gloabl admin is authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_ADMIN
        })
      );
    try {
      expect(response.status).toBe(200);
    } catch {
      expect(response.status).toBe(504);
    }
  });
  it('gloabl view user is authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_VIEW
        })
      );
    try {
      expect(response.status).toBe(200);
    } catch {
      expect(response.status).toBe(504);
    }
  });
});
