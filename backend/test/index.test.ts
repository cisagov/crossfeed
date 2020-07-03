import * as request from 'supertest';
import { BACKEND_URL } from './constants';

describe('GET /', () => {
  it('should return 200', async () => {
    const response = await request(BACKEND_URL)
      .get('/')
      .expect(200);
    expect(response.body).toMatchSnapshot();
  });
});