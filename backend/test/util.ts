import * as jwt from 'jsonwebtoken';
import { UserType } from '../src/models';
import { UserToken } from '../src/api/auth';

export const DUMMY_USER_ID = 'c1afb49c-2216-4e3c-ac52-aa9480956ce9';

export function createUserToken(user: Partial<UserToken> = {}) {
  const token = jwt.sign(
    {
      roles: [],
      id: DUMMY_USER_ID,
      userType: UserType.STANDARD,
      dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z'),
      ...user
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1 day'
    }
  );
  return token;
}
