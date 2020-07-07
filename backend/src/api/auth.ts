import loginGov from './login-gov';

export const login = async (event, context, callback) => {
  const url = await loginGov.login();
  callback(null, {
    statusCode: 302,
    headers: {
      Location: url
    }
  });
};

export const callback = async (event) => {
  await loginGov.callback(event);
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
