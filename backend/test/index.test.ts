import * as request from 'supertest';
import app from '../src/api/app';

describe('GET /', () => {
  it('should return 200', async () => {
    const response = await request(app).get('/').expect(200);
    expect(response.body).toMatchSnapshot();
  });
});
