import * as request from 'supertest';
import { BACKEND_URL, JWT_SECRET } from './constants';
import * as jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    id: '123',
    email: 'user@example.com',
    userType: 'globalAdmin',
    roles: []
  },
  JWT_SECRET,
  {
    expiresIn: '1 day',
    header: {
      typ: 'JWT'
    }
  }
);

describe('organizations', () => {
  it('add new organization', async () => {
    const name = 'cisa-test-' + Math.random();
    const response = await request(BACKEND_URL)
      .post('/organizations/')
      .set('Authorization', token)
      .send({
        ipBlocks: [],
        name,
        rootDomains: ['cisa.gov'],
        isPassive: false,
        inviteOnly: true
      })
      .expect(200);
    expect(response.body).toMatchSnapshot({
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      id: expect.any(String),
      name: expect.any(String)
    });
    expect(response.body.name).toEqual(name);
  });
  it("can't add organization with the same name", async () => {
    const name = 'cisa-test-' + Math.random();
    await request(BACKEND_URL)
      .post('/organizations/')
      .set('Authorization', token)
      .send({
        ipBlocks: [],
        name,
        rootDomains: ['cisa.gov'],
        isPassive: false,
        inviteOnly: true
      })
      .expect(200);
    const response = await request(BACKEND_URL)
      .post('/organizations/')
      .set('Authorization', token)
      .send({
        ipBlocks: [],
        name,
        rootDomains: ['cisa.gov'],
        isPassive: false,
        inviteOnly: true
      })
      .expect(500);
    expect(response.body).toMatchSnapshot();
  });
});
