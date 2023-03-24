import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';
import { connectToDatabase, UserType } from '../src/models';

const nock = require('nock');

describe('pe-proxy', () => {
  beforeAll(async () => {
    await connectToDatabase();
    process.env.PE_API_URL = 'http://localhost:8080';
    nock('http://localhost:8080').get('/pe').reply(200, 'OK');
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
    expect(response.status).toBe(200);
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
    expect(response.status).toBe(200);
  });
});
