import * as jwt from 'jsonwebtoken';
import { UserToken } from '../src/api/auth';

export function createUserToken(user: Partial<UserToken> = {}) {
  const token = jwt.sign(
    {
      roles: [],
      id: 'cisa:crossfeed:testuser',
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
