import * as request from 'supertest';
import app from '../src/api/app';
import { User } from '../src/models';
jest.mock('../src/api/login-gov');

jest.mock('jsonwebtoken', () => ({
  verify: (a, b, cb) =>
    cb(null, {
      email: 'test2@crossfeed.cisa.gov',
      email_verified: true
    }),
  sign: jest.requireActual('jsonwebtoken').sign
}));

describe('auth', () => {
  describe('login', () => {
    it('success', async () => {
      const response = await request(app).post('/auth/login').expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });
  describe('callback', () => {
    it('success with login.gov', async () => {
      const response = await request(app)
        .post('/auth/callback')
        .send({
          code: 'CODE',
          state: 'STATE',
          origState: 'ORIGSTATE',
          nonce: 'NONCE'
        })
        .expect(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toEqual('test@crossfeed.cisa.gov');
      const user = await User.findOne(response.body.user.id);
      expect(user?.firstName).toEqual('');
      expect(user?.lastName).toEqual('');
    });
    it('success with cognito', async () => {
      process.env.USE_COGNITO = '1';
      const response = await request(app)
        .post('/auth/callback')
        .send({
          token: 'TOKEN'
        })
        .expect(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toEqual('test2@crossfeed.cisa.gov');
      const user = await User.findOne(response.body.user.id);
      expect(user?.firstName).toEqual('');
      expect(user?.lastName).toEqual('');
      process.env.USE_COGNITO = '';
    });
  });
});
