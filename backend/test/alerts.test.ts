import * as request from 'supertest';
import app from '../src/api/app';
import { User, connectToDatabase, Alert, AlertType } from '../src/models';
import { createUserToken } from './util';

describe('alerts', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  it('create by user should succeed', async () => {
    const user = await User.create({
      firstName: '',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov',
      userType: 'standard'
    }).save();
    const response = await request(app)
      .post('/alerts')
      .set(
        'Authorization',
        createUserToken({
          id: user.id,
          userType: 'standard'
        })
      )
      .send({
        type: AlertType.NEW_DOMAIN,
        frequency: 100
      })
      .expect(200);
    const response2 = await request(app)
      .get('/users/me')
      .set(
        'Authorization',
        createUserToken({
          id: user.id,
          userType: 'standard'
        })
      )
      .expect(200);

    expect(response.body.type).toEqual(response2.body.alerts[0].type);
    expect(response.body.id).toEqual(response2.body.alerts[0].id);
    expect(response.body.type).toEqual(AlertType.NEW_DOMAIN);
    expect(response.body.frequency).toEqual(100);
    expect(response2.body.alerts).toHaveLength(1);
  });
  it('delete by user for own alert should succeed', async () => {
    const user = await User.create({
      firstName: '',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov',
      userType: 'standard'
    }).save();
    const alert = await Alert.create({
      type: AlertType.NEW_VULNERABILITY,
      frequency: 10,
      user: user
    }).save();
    const response = await request(app)
      .delete('/alerts/' + alert.id)
      .set(
        'Authorization',
        createUserToken({
          id: user.id,
          userType: 'standard'
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
          userType: 'standard'
        })
      )
      .expect(200);

    expect(response2.body.alerts).toHaveLength(0);
  });
  it("delete by user for other user's alert should fail", async () => {
    const user = await User.create({
      firstName: '',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov',
      userType: 'standard'
    }).save();
    const user1 = await User.create({
      firstName: '',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov',
      userType: 'globalAdmin'
    }).save();
    const alert = await Alert.create({
      type: AlertType.NEW_VULNERABILITY,
      frequency: 10,
      user: user
    }).save();
    const response = await request(app)
      .delete('/alerts/' + alert.id)
      .set(
        'Authorization',
        createUserToken({
          id: user1.id,
          userType: 'globalAdmin'
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
          userType: 'standard'
        })
      )
      .expect(200);

    expect(response2.body.alerts).toHaveLength(1);
  });
});
