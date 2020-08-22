import * as jwt from 'jsonwebtoken';
import { UserToken } from '../src/api/auth';

export const DUMMY_USER_ID = 'c1afb49c-2216-4e3c-ac52-aa9480956ce9';

export function createUserToken(user: Partial<UserToken> = {}) {
  const token = jwt.sign(
    {
      roles: [],
      id: DUMMY_USER_ID,
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
