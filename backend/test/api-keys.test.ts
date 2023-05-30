import * as request from 'supertest';
import app from '../src/api/app';
import { User, connectToDatabase, ApiKey, UserType } from '../src/models';
import { createUserToken } from './util';

jest.mock('../src/tasks/scheduler', () => ({
  handler: jest.fn()
}));

describe('api-key', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  describe('generate', () => {
    it('generate by user should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const response = await request(app)
        .post('/api-keys')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);
      const response2 = await request(app)
        .get('/users/me')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .expect(200);

      expect(response.body.hashedKey).toEqual(
        response2.body.apiKeys[0].hashedKey
      );
      expect(response.body.key.substr(-4)).toEqual(
        response2.body.apiKeys[0].lastFour
      );
      expect(response2.body.apiKeys).toHaveLength(1);
      // API key should not be returned
      expect(response2.body.apiKeys[0].key).toEqual(undefined);
    });
    it('delete by user for own key should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const apiKey = await ApiKey.create({
        hashedKey: '1234',
        lastFour: '1234',
        user: user
      }).save();
      const response = await request(app)
        .delete('/api-keys/' + apiKey.id)
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);

      const response2 = await request(app)
        .get('/users/me')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .expect(200);

      expect(response2.body.apiKeys).toHaveLength(0);
    });
    it("delete by user for other user's key should fail", async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const user1 = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.GLOBAL_ADMIN
      }).save();
      const apiKey = await ApiKey.create({
        hashedKey: '1234',
        lastFour: '1234',
        user: user
      }).save();
      const response = await request(app)
        .delete('/api-keys/' + apiKey.id)
        .set(
          'Authorization',
          createUserToken({
            id: user1.id,
            userType: UserType.GLOBAL_ADMIN
          })
        )
        .send({})
        .expect(404);

      const response2 = await request(app)
        .get('/users/me')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .expect(200);

      expect(response2.body.apiKeys).toHaveLength(1);
    });
    it('using valid API key should succeed', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const response = await request(app)
        .post('/api-keys')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);

      const standardResponse = await request(app)
        .get('/users/me')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .expect(200);

      const responseWithAPIKey = await request(app)
        .get('/users/me')
        .set('Authorization', response.body.key)
        .expect(200);

      expect(JSON.stringify(standardResponse.body)).toEqual(
        JSON.stringify(responseWithAPIKey.body)
      );
    });
    it('using invalid API key should fail', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const response = await request(app)
        .post('/api-keys')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);

      const responseWithAPIKey = await request(app)
        .get('/users/me')
        .set('Authorization', '1234')
        .expect(401);
    });
    it('using revoked API key should fail', async () => {
      const user = await User.create({
        firstName: '',
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        userType: UserType.STANDARD
      }).save();
      const response = await request(app)
        .post('/api-keys')
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);

      const response2 = await request(app)
        .delete('/api-keys/' + response.body.id)
        .set(
          'Authorization',
          createUserToken({
            id: user.id,
            userType: UserType.STANDARD
          })
        )
        .send({})
        .expect(200);

      const responseWithAPIKey = await request(app)
        .get('/users/me')
        .set('Authorization', response.body.key)
        .expect(401);
    });
  });
});
