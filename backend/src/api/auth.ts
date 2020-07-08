import loginGov from './login-gov';

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
  const user = await loginGov.callback(JSON.parse(event.body));
  // TODO: validate user, create if needed, and sign session
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(user)
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
