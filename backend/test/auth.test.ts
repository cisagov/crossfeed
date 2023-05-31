import * as request from 'supertest';
import app from '../src/api/app';
import { User } from '../src/models';
jest.mock('../src/api/login-gov');

jest.mock('jsonwebtoken', () => ({
  verify: (a, b, cb) => {
    cb(null, {
      email: a.split('TOKEN_')[1],
      email_verified: true,
      sub: Math.random() + ''
    });
  },
  sign: jest.requireActual('jsonwebtoken').sign
}));

describe('auth', () => {
  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
  });

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
          token: 'TOKEN_test2@crossfeed.cisa.gov'
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

    it('success with cognito with two different ids - should overwrite cognitoId', async () => {
      process.env.USE_COGNITO = '1';
      let response = await request(app)
        .post('/auth/callback')
        .send({
          token: 'TOKEN_test3@crossfeed.cisa.gov'
        })
        .expect(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toEqual('test3@crossfeed.cisa.gov');
      const { id, cognitoId } = response.body.user;
      expect(cognitoId).toBeTruthy();
      expect(id).toBeTruthy();

      response = await request(app)
        .post('/auth/callback')
        .send({
          token: 'TOKEN_test3@crossfeed.cisa.gov'
        })
        .expect(200);
      const user = (await User.findOne(response.body.user.id)) as User;
      expect(user.id).toEqual(id);
      expect(user.cognitoId).not.toEqual(cognitoId);
      process.env.USE_COGNITO = '';
    });

    it('login with login.gov and later cognito should preserve ids', async () => {
      let response = await request(app)
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
      const { id, loginGovId } = response.body.user;
      expect(id).toBeTruthy();
      expect(loginGovId).toBeTruthy();

      process.env.USE_COGNITO = '1';
      response = await request(app)
        .post('/auth/callback')
        .send({
          token: 'TOKEN_test@crossfeed.cisa.gov'
        })
        .expect(200);
      expect(response.body.token).toBeTruthy();

      const user = (await User.findOne(response.body.user.id)) as User;
      expect(user.email).toEqual('test@crossfeed.cisa.gov');
      expect(user.id).toEqual(id);
      expect(user.loginGovId).toEqual(loginGovId);
      expect(user.cognitoId).toBeTruthy();
      process.env.USE_COGNITO = '';
    });

    it('verify that the lastLoggedIn value is added to the database and updated', async () => {
      process.env.USE_COGNITO = '1';
      const time_1 = new Date(Date.now());
      const response = await request(app)
        .post('/auth/callback')
        .send({
          token: 'TOKEN_test4@crossfeed.cisa.gov'
        })
        .expect(200);
      const time_2 = new Date(Date.now());
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.lastLoggedIn).toBeTruthy();
      expect(
        response.body.user.lastLoggedIn > time_1 &&
          response.body.user.lastLoggedIn < time_2
      );
      process.env.USE_COGNITO = '';
    });
  });
});
