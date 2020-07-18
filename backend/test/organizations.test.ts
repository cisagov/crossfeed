import * as request from 'supertest';
import app from '../src/api/app';
import { createUserToken } from './util';


describe('organizations', () => {
  it('add new organization', async () => {
    const name = 'cisa-test-' + Math.random();
    const response = await request(app)
      .post('/organizations/')
      .set('Authorization', createUserToken())
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
    await request(app)
      .post('/organizations/')
      .set('Authorization', createUserToken())
      .send({
        ipBlocks: [],
        name,
        rootDomains: ['cisa.gov'],
        isPassive: false,
        inviteOnly: true
      })
      .expect(200);
    const response = await request(app)
      .post('/organizations/')
      .set('Authorization', createUserToken())
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
