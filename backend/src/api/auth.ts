import loginGov from './login-gov';
import { User, connectToDatabase } from '../models';
import { JWT, JWK } from 'jose';

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

export const callback = async (event, context, callback) => {
  let userInfo;
  try {
    userInfo = await loginGov.callback(JSON.parse(event.body));
  } catch {
    callback(null, {
      statusCode: 500,
      body: ''
    });
  }

  if (!userInfo.email_verified) {
    callback(null, {
      statusCode: 403,
      body: ''
    });
    return;
  }

  // Look up user by uuid
  await connectToDatabase();
  const user = await User.findOne({
    id: userInfo.sub
  });

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
      existing: !!user,
      token: token,
      user: userInfo
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

export const authorize = async (event, context, callback) => {
  console.log('event', event);
  console.log('event', event.authorizationToken);
  // if (!event.authorizationToken) {
  //   return callback('Unauthorized');
  // }
  try {
    const effect = 'Allow';
    const userId = '123';
    const authorizerContext = { name: 'user' };
    return callback(
      null,
      generatePolicy(userId, effect, event.methodArn, authorizerContext)
    );
  } catch (err) {
    console.log('catch error. Invalid token', err);
    return callback('Unauthorized');
  }
};

export const register = async (event, context, callback) => {
  try {
    console.log(event.body);
    const { token, firstName, lastName } = JSON.parse(event.body);
    const parsed: any = JWT.verify(token, JWK.asKey(process.env.JWT_KEY!));

    console.log(parsed);
    await connectToDatabase();
    const user = await User.insert({
      firstName,
      lastName,
      email: parsed.email,
      id: parsed.id,
      fullName: ''
    });
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(user)
    });
  } catch (e) {
    console.log(e);
    callback(null, {
      statusCode: 500,
      body: ''
    });
  }
};
