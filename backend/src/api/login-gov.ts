import * as crypto from 'crypto';
import { Issuer, ClientMetadata } from 'openid-client';

var loginGov: any = {
  discoveryUrl:
    process.env.DISCOVERY_URL || 'https://idp.int.identitysandbox.gov'
};

var jwkSet = {
  keys: [JSON.parse(process.env.JWT_KEY!)]
};

var clientOptions: ClientMetadata = {
  client_id: 'urn:gov:gsa:openidconnect.profiles:sp:sso:cisa:crossfeed',
  token_endpoint_auth_method: 'private_key_jwt',
  id_token_signed_response_alg: 'RS256',
  key: 'client_id',
  redirect_uris: ['http://localhost:3000/auth/callback'],
  token_endpoint: 'https://idp.int.identitysandbox.gov/api/openid_connect/token'
};

loginGov.login = async function () {
  const issuer = await Issuer.discover(loginGov.discoveryUrl);
  var client = new issuer.Client(clientOptions, jwkSet);
  return client.authorizationUrl({
    response_type: 'code',
    acr_values: `http://idmanagement.gov/ns/assurance/loa/1`,
    scope: 'openid email',
    redirect_uri: `http://localhost:3000/auth/callback`,
    nonce: loginGov.randomString(32),
    state: loginGov.randomString(32),
    prompt: 'select_account'
  });
};

loginGov.callback = async function (event) {
  try {
    const issuer = await Issuer.discover(loginGov.discoveryUrl);
    var client = new issuer.Client(clientOptions, jwkSet);
    const tokenSet = await client.oauthCallback(
      'http://localhost:3000/auth/callback',
      event.queryStringParameters,
      {
        state: event.queryStringParameters.state
        // nonce: event.queryStringParameters.nonce // TODO: store nonce as client state
      }
    );
    const claims = tokenSet.claims();
    console.log(tokenSet);
    const userInfo = await client.userinfo(tokenSet);
    console.log(userInfo);
    return userInfo;
  } catch (e) {
    console.log('an error occurred');
    console.log(e);
  }
};

loginGov.randomString = function (length) {
  return crypto.randomBytes(length).toString('hex');
};

export default loginGov;
