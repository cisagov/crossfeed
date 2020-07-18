import * as request from 'supertest';
import app from '../src/api/app';
import { User } from '../src/models';
jest.mock('../src/api/login-gov');

describe('auth', () => {
  describe('login', () => {
    it('success', async () => {
      const response = await request(app)
        .post('/auth/login')
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });
  describe('callback', () => {
    it('success', async () => {
      const response = await request(app)
        .post('/auth/callback')
        .send({
          code: "CODE",
          state: "STATE",
          origState: "ORIGSTATE",
          nonce: "NONCE"
        })
        .expect(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toEqual("test@crossfeed.cisa.gov");
      const user = await User.findOne(response.body.user.id);
      expect(user?.firstName).toEqual("");
      expect(user?.lastName).toEqual("");
    });
  });
});
