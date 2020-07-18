import * as jwt from 'jsonwebtoken';

export function createUserToken(user = {}) {
  const token = jwt.sign(
    {
      id: '123',
      email: 'user@example.com',
      userType: 'globalAdmin',
      roles: [],
      ...user
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1 day',
      header: {
        typ: 'JWT'
      }
    }
  );
  return token;
}