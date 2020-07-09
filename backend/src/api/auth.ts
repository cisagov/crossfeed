import loginGov from './login-gov';
import { User, connectToDatabase } from '../models';
import { JWT, JWK } from 'jose';

/** Returns redirect url to initiate login.gov OIDC flow */
export const login = async (event, context, callback) => {
  const { url, state, nonce } = await loginGov.login();
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      redirectUrl: url,
      state: state,
      nonce: nonce
    })
  });
};

/** Processes login.gov OIDC callback and returns user token */
export const callback = async (event, context, callback) => {
  let userInfo;
  try {
    userInfo = await loginGov.callback(JSON.parse(event.body));
  } catch (e) {
    return callback(null, {
      statusCode: 500,
      body: ''
    });
  }

  if (!userInfo.email_verified) {
    return callback(null, {
      statusCode: 403,
      body: ''
    });
  }

  // Look up user by email
  await connectToDatabase();
  let user = await User.findOne({
    email: userInfo.email
  });

  // If user does not exist, create it
  if (!user) {
    user = User.create({
      email: userInfo.email,
      loginGovId: userInfo.sub,
      firstName: '',
      lastName: ''
    });
    await user.save();
  }

  const token = JWT.sign(
    {
      id: userInfo.sub,
      email: userInfo.email
    },
    JWK.asKey(process.env.JWT_KEY!),
    {
      expiresIn: '30 days',
      header: {
        typ: 'JWT'
      }
    }
  );

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      token: token,
      user: user
    })
  });
};

// Policy helper function
const generatePolicy = (userId, effect, resource, context) => {
  return {
    principalId: userId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: '*' // #2
        }
      ]
    },
    context
  };
};

/** Confirms that a user is authorized */
// TODO: Add access controls per API function
export const authorize = async (event, context, callback) => {
  try {
    const parsed = JWT.verify(
      event.authorizationToken,
      JWK.asKey(process.env.JWT_KEY!)
    );
    const effect = 'Allow';
    const userId = '123';
    const authorizerContext = { name: 'user' };
    return callback(
      null,
      generatePolicy(userId, effect, event.methodArn, authorizerContext)
    );
  } catch {
    return callback('Unauthorized');
  }
};
