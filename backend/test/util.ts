import * as jwt from 'jsonwebtoken';
import { UserToken } from '../src/api/auth';
import { connectToDatabase, User, Role } from '../src/models';

export async function createUserToken(user: Partial<UserToken> = {}) {
  await connectToDatabase();
  let existingUser = await User.findOne(
    {
      email: 'test@crossfeed.cisa.gov'
    },
    { relations: ['roles'] }
  );

  // If user does not exist, create it
  if (!existingUser) {
    existingUser = User.create({
      email: 'test@crossfeed.cisa.gov',
      loginGovId: '',
      firstName: '',
      lastName: '',
      userType: user.userType || 'standard',
      roles: []
    });
  } else {
    existingUser.userType = user.userType || existingUser.userType;

    for (const role of existingUser.roles) {
      await role.remove();
    }
  }
  await existingUser.save();
  if (user.roles) {
    for (const role of user.roles) {
      await Role.insert({
        user: existingUser,
        organization: { id: role.org },
        approved: true,
        role: role.role
      });
    }
  }

  const token = jwt.sign(
    {
      roles: [],
      id: existingUser.id,
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
