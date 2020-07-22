import * as jwt from 'jsonwebtoken';
import { UserToken } from '../src/api/auth';

export function createUserToken(user: Partial<UserToken> = {}) {
  const token = jwt.sign(
    {
      roles: [],
      id: 'c1afb49c-2216-4e3c-ac52-aa9480956ce9',
      userType: 'standard',
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
