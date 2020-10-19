import loginGov from './login-gov';
import { User, connectToDatabase } from '../models';
import * as jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwksClient from 'jwks-rsa';

export interface UserToken {
  email: string;
  id: string;
  userType: 'standard' | 'globalView' | 'globalAdmin';
  roles: {
    org: string;
    role: 'user' | 'admin';
  }[];
  dateAcceptedTerms: Date | undefined;
  acceptedTermsVersion: string | undefined;
}

interface CognitoUserToken {
  sub: string;
  aud: string;
  email_verified: boolean;
  event_id: string;
  token_us: string;
  auth_time: number;
  iss: string;
  'cognito:username': string;
  exp: number;
  iat: number;
  email: string;
}

interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
}

const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.REACT_APP_USER_POOL_ID}/.well-known/jwks.json`
});
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
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

const userTokenBody = (user): UserToken => ({
  id: user.id,
  email: user.email,
  userType: user.userType,
  dateAcceptedTerms: user.dateAcceptedTerms,
  acceptedTermsVersion: user.acceptedTermsVersion,
  roles: user.roles
    .filter((role) => role.approved)
    .map((role) => ({
      org: role.organization.id,
      role: role.role
    }))
});

/** Processes login.gov OIDC callback and returns user token */
export const callback = async (event, context) => {
  let userInfo: UserInfo;
  try {
    if (process.env.USE_COGNITO) {
      userInfo = await new Promise((resolve, reject) =>
        jwt.verify(
          JSON.parse(event.body).token,
          getKey,
          (err, data: CognitoUserToken) => (err ? reject(err) : resolve(data))
        )
      );
    } else {
      userInfo = await loginGov.callback(JSON.parse(event.body));
    }
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

  userInfo.email = userInfo.email.toLowerCase();

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

  const idKey = `${process.env.USE_COGNITO ? 'cognitoId' : 'loginGovId'}`;

  // If user does not exist, create it
  if (!user) {
    user = User.create({
      email: userInfo.email,
      [idKey]: userInfo.sub,
      firstName: '',
      lastName: '',
      userType: process.env.IS_OFFLINE ? 'globalAdmin' : 'standard',
      roles: []
    });
    await user.save();
  }

  if (user[idKey] !== userInfo.sub) {
    user[idKey] = userInfo.sub;
    await user.save();
  }

  // Update user status if accepting invite
  if (user.invitePending) {
    user.invitePending = false;
    await user.save();
  }

  const token = jwt.sign(userTokenBody(user), process.env.JWT_SECRET!, {
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
    await connectToDatabase();
    const user = await User.findOne(
      {
        id: parsed.id
      },
      {
        relations: ['roles', 'roles.organization']
      }
    );
    // For running tests, ignore the database results if user doesn't exist or is the dummy user
    if (
      process.env.NODE_ENV === 'test' &&
      (!user || user.id === 'c1afb49c-2216-4e3c-ac52-aa9480956ce9')
    ) {
      return parsed;
    }
    if (!user) throw Error('User does not exist');
    return userTokenBody(user);
  } catch (e) {
    console.error(e);
    const parsed = { id: 'cisa:crossfeed:anonymous' };
    return parsed;
  }
};

/** Check if a user has global write admin permissions */
export const isGlobalWriteAdmin = (event: APIGatewayProxyEvent) => {
  return event.requestContext.authorizer &&
    event.requestContext.authorizer.userType === 'globalAdmin'
    ? true
    : false;
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
export const getOrgMemberships = (event: APIGatewayProxyEvent): string[] => {
  if (!event.requestContext.authorizer) return [];
  return event.requestContext.authorizer.roles.map((role) => role.org);
};

/** Returns a user's id */
export const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.requestContext.authorizer!.id;
};
