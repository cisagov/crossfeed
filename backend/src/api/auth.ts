import loginGov from './login-gov';
import { User, connectToDatabase } from '../models';
import * as jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';

interface UserToken {
  email: string;
  id: string;
  userType: 'standard' | 'globalView' | 'globalAdmin';
  roles: {
    org: string;
    role: 'user' | 'admin';
  }[];
}

/** Returns redirect url to initiate login.gov OIDC flow */
export const login = async (event, context) => {
  const { url, state, nonce } = await loginGov.login();
  return {
    statusCode: 200,
    body: JSON.stringify({
      redirectUrl: url,
      state: state,
      nonce: nonce
    })
  };
};

/** Processes login.gov OIDC callback and returns user token */
export const callback = async (event, context) => {
  let userInfo;
  try {
    userInfo = await loginGov.callback(JSON.parse(event.body));
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: ''
    };
  }

  if (!userInfo.email_verified) {
    return {
      statusCode: 403,
      body: ''
    };
  }

  // Look up user by email
  await connectToDatabase();
  let user = await User.findOne(
    {
      email: userInfo.email
    },
    {
      relations: ['roles', 'roles.organization']
    }
  );

  // If user does not exist, create it
  if (!user) {
    user = User.create({
      email: userInfo.email,
      loginGovId: userInfo.sub,
      firstName: '',
      lastName: '',
      userType: process.env.IS_OFFLINE ? 'globalAdmin' : 'standard',
      roles: []
    });
    await user.save();
  }

  const tokenBody: UserToken = {
    id: userInfo.sub,
    email: userInfo.email,
    userType: user.userType,
    roles: user.roles
      .filter((role) => role.approved)
      .map((role) => ({
        org: role.organization.id,
        role: role.role
      }))
  };

  const token = jwt.sign(tokenBody, process.env.JWT_SECRET!, {
    expiresIn: '1 day',
    header: {
      typ: 'JWT'
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      token: token,
      user: user
    })
  };
};

/** Confirms that a user is authorized */
export const authorize = async (event) => {
  try {
    const parsed: UserToken = jwt.verify(
      event.authorizationToken,
      process.env.JWT_SECRET!
    ) as UserToken;
    return parsed;
  } catch (e) {
    const parsed = {"id": "cisa:crossfeed:anonymous"};
    return parsed;
  }
};

/** Check if a user has global write admin permissions */
export const isGlobalWriteAdmin = (event: APIGatewayProxyEvent) => {
  return (
    event.requestContext.authorizer &&
    event.requestContext.authorizer.userType === 'globalAdmin'
  );
};

/** Check if a user has global view permissions */
export const isGlobalViewAdmin = (event: APIGatewayProxyEvent) => {
  return (
    event.requestContext.authorizer &&
    (event.requestContext.authorizer.userType === 'globalView' ||
      event.requestContext.authorizer.userType === 'globalAdmin')
  );
};

/** Checks if the current user is allowed to access (modify) a user with id userId */
export const canAccessUser = (event: APIGatewayProxyEvent, userId?: string) => {
  return userId && (userId === getUserId(event) || isGlobalWriteAdmin(event));
};

/** Checks if a user is an admin of the given organization */
export const isOrgAdmin = (
  event: APIGatewayProxyEvent,
  organizationId?: string
) => {
  if (!organizationId || !event.requestContext.authorizer) return false;
  for (const role of event.requestContext.authorizer.roles) {
    if (role.org === organizationId && role.role === 'admin') return true;
  }
  return isGlobalWriteAdmin(event);
};

/** Returns the organizations a user is a member of */
export const getOrgMemberships = (event: APIGatewayProxyEvent) => {
  if (!event.requestContext.authorizer) return [];
  return event.requestContext.authorizer.roles.map((role) => role.org);
};

/** Returns a user's id */
export const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.requestContext.authorizer!.id;
};
