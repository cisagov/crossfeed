import * as request from 'supertest';
import { BACKEND_URL } from './constants';

describe('organizations', () => {
  it('add new organization', async () => {
    const response = await request(BACKEND_URL)
      .post('/organizations/')
      .send({
        ipBlocks: [],
        name: "cisa-test-8697283f-8f04-4b99-8caf-4270da0e678c",
        rootDomains: ["cisa.gov"]
      })
      .expect(200);
    expect(response.body).toMatchSnapshot({
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      id: expect.any(String),
    });
  });
  it("can't add organization with the same name", async () => {
    const name = "cisa-test-8697283f-8f04-4b99-8caf-4270da0e678d";
    await request(BACKEND_URL)
      .post('/organizations/')
      .send({
        ipBlocks: [],
        name,
        rootDomains: ["cisa.gov"]
      })
      .expect(200);
    const response = await request(BACKEND_URL)
      .post('/organizations/')
      .send({
        ipBlocks: [],
        name,
        rootDomains: ["cisa.gov"]
      })
      .expect(500);
    expect(response.body).toMatchSnapshot();
  });
});