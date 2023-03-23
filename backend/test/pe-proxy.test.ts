import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';
import { connectToDatabase, UserType } from '../src/models';
import { createProxyMiddleware } from 'http-proxy-middleware';

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn()
}));

describe('pe-proxy', () => {
  beforeAll(async () => {
    await connectToDatabase();
    (createProxyMiddleware as jest.Mock).mockImplementation(() => 200);
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
      )
      .expect(200);
  });
  it('global view user is authorized to access P&E proxy', async () => {
    const response = await request(app)
      .get('/pe')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_VIEW
        })
      )
      .expect(200);
  });
});
