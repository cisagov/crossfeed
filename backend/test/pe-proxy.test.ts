import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';
import { connectToDatabase, UserType } from '../src/models';
import { createProxyMiddleware } from 'http-proxy-middleware';
// import nock from 'nock';

const nock = require('nock');

// const createProxyMiddleware = jest.fn();

describe('pe-proxy', () => {
  beforeAll(async () => {
    await connectToDatabase();
    nock('http://fakePeApi.com')
      .get('/api')
      .reply(200, { message: 'Hello from fake pe server' });
  });
  it('standard user is not authorized to access P&E proxy', async () => {
    app.use(
      '/pe',
      createProxyMiddleware({
        target: 'http://fakePeApi.com',
        changeOrigin: true
      })
    );

    const response = await request(app)
      .get('/pe/api')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.STANDARD
        })
      )
      .expect(401);
    expect(response.text).toEqual('Unauthorized');
    // expect(createProxyMiddleware).toBeCalledTimes(0);
  });
  it('global admin is authorized to access P&E proxy', async () => {
    app.use(
      '/pe',
      createProxyMiddleware({
        target: 'http://fakePeApi.com',
        changeOrigin: true
      })
    );

    const response = await request(app)
      .get('/pe/api')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_ADMIN
        })
      )
      .expect(200);
  });
  it('global view user is authorized to access P&E proxy', async () => {
    app.use(
      '/pe',
      createProxyMiddleware({
        target: 'http://fakePeApi.com',
        changeOrigin: true
      })
    );

    const response = await request(app)
      .get('/pe/api')
      .set(
        'Authorization',
        createUserToken({
          userType: UserType.GLOBAL_VIEW
        })
      )
      .expect(200);
  });
});
